// The background worker for the extension
// Handles a variety of events, including:
// - installs
// - uninstalls
// - omnibox events and queries

import {
  getApiKey,
  getRules,
  getSettings,
  setSettings,
  getTeamData,
  setTeamData,
} from '../../storage';
import {
  operandClient,
  ObjectService,
  ObjectType,
  IndexService,
  Index,
} from '@operandinc/sdk';

// On Install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Installed!');
  const settings = await getSettings();
  if (!settings) {
    // Set defaults
    await setSettings({
      apiKey: '',
      searchInjectionEnabled: true,
      automaticIndexingDestination: '',
      automaticIndexingEnabled: false,
      manualIndexingMostRecentDestination: '',
    });
  }
  // If the token is not set, open the options page
  const token = await getApiKey();
  if (!token || token === '') {
    chrome.runtime.openOptionsPage();
  }
});
// Ombnibox
chrome.omnibox.onInputEntered.addListener(function (text) {
  if (!text) return;
  var newURL = 'https://operand.ai/feed?q=' + text;
  chrome.tabs.create({ url: newURL });
});

const ignorePrefixes = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'http://localhost',
  'https://www.google.com/search',
  'https://operand.ai/',
];

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    if (ignorePrefixes.some((prefix) => tab.url?.startsWith(prefix))) {
      return;
    }
    var blocked = false;
    await getRules().then((rules) => {
      if (rules) {
        for (const rule of rules) {
          const url = new URL(tab.url!);
          var host = url.host;

          if (host.startsWith('www.')) {
            host = host.substring(4);
          }
          var hostname = url.hostname;
          if (hostname.startsWith('www.')) {
            hostname = hostname.substring(4);
          }
          if (host === rule.domain || hostname === rule.domain) {
            blocked = true;
          }
        }
      }
    });
    if (blocked) {
      return;
    }
    // Get API key
    const settings = await getSettings();

    if (!settings) {
      return;
    }
    // If the API key is not set
    if (!settings.apiKey || !settings.automaticIndexingEnabled) {
      return;
    }
    // Send the url to the destination index
    const client = operandClient(
      ObjectService,
      settings.apiKey,
      'https://api.operand.ai'
    );
    if (!tab.url) {
      return;
    }
    const url = new URL(tab.url);
    const cleanUrl = `${url.protocol}//${url.host}${url.pathname}`;
    client.upsert(
      {
        type: ObjectType.HTML,
        metadata: {
          value: {
            case: 'html',
            value: {
              html: undefined,
            },
          },
        },
        properties: {
          properties: {
            _url: {
              indexed: false,
              value: {
                case: 'text',
                value: cleanUrl,
              },
            },
          },
        },
        uniqueProperty: '_url',
      },
      {
        headers: {
          'Operand-Index-Id': settings.automaticIndexingDestination,
        },
      }
    );
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.type === 'openOptions') {
    chrome.runtime.openOptionsPage();
  }
});

async function checkTeams() {
  // We want to check if the user has any teams
  const settings = await getSettings();
  if (!settings) {
    return;
  }
  if (!settings.apiKey) {
    return;
  }
  const client = operandClient(
    IndexService,
    settings.apiKey,
    'https://api.operand.ai'
  );
  const response = await client.listIndexes({});

  const teamIndexes = response.indexes.filter(isLikelyTeamIndex);

  if (teamIndexes.length > 0) {
    // We have team indexes
    // We want to store these in the teams data structure
    const data = await getTeamData();
    if (data) {
      // Check all the existing teams in the data structure to see if they are still valid
      data.teams = data.teams.filter((team) => {
        return teamIndexes.some(
          (index) => index.publicId === team.indexPublicId
        );
      });
      // Add any new teams
      teamIndexes.forEach((index) => {
        if (!data.teams.some((team) => team.indexPublicId === index.publicId)) {
          data.teams.push({
            name: index.name,
            indexPublicId: index.publicId,
          });
        }
      });
      await setTeamData(data);
    } else {
      // We have no team data
      await setTeamData({
        teams: teamIndexes.map((index) => {
          return {
            name: index.name,
            indexPublicId: index.publicId,
          };
        }),
      });
    }
  } else {
    // We have no team indexes
    // We want to clear the team data
    await setTeamData({
      activeTeamId: undefined,
      teams: [],
    });
  }
}

// On load
chrome.runtime.onStartup.addListener(async () => {
  console.log('Startup!');
  await checkTeams();
});

// Checks if an index is likely to be the team's index.
// This is a heuristic, and not guaranteed to be correct.
export function isLikelyTeamIndex(index: Index): boolean {
  return !index.public && index.name.startsWith('(Team)');
}
