// The background worker for the extension
// Handles a variety of events, including:
// - installs
// - uninstalls
// - omnibox events and queries

import {
  deleteIndexData,
  getApiKey,
  getIndexData,
  getRules,
  getSettings,
  setIndexData,
  setSettings,
  StoredIndex,
} from '../../storage';
import {
  operandClient,
  ObjectService,
  ObjectType,
  Index,
  IndexService,
} from '@operandinc/sdk';

export const endpoint = 'https://api.operand.ai';
// On Install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Installed!');
  chrome.alarms.create('fetchIndexes', { periodInMinutes: 60 * 3 });
  const settings = await getSettings();
  if (!settings) {
    // Set defaults
    await setSettings({
      apiKey: '',
      searchInjectionEnabled: true,
      automaticIndexingDestination: '',
      automaticIndexingEnabled: false,
      manualIndexingMostRecentDestination: '',
      defaultResults: 1,
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

// On Alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'fetchIndexes') {
    await fetchIndexes();
  }
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
    const client = operandClient(ObjectService, settings.apiKey, endpoint);
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
chrome.runtime.onMessage.addListener(async function (request) {
  // If the message is to open the options page
  if (request.type === 'openOptions') {
    chrome.runtime.openOptionsPage();
  }
  // If the message is to get the indexes
  else if (request.type === 'setApiKey') {
    await fetchIndexes();
  }
});

async function fetchIndexes() {
  console.log('fetching indexes');
  // We want to check if the user has any indexes
  const settings = await getSettings();
  if (!settings) {
    return;
  }
  if (!settings.apiKey || settings.apiKey === '') {
    console.log('no api key');
    return;
  }
  const client = operandClient(IndexService, settings.apiKey, endpoint);
  const subscribedIndexes = await client.subscriptions({});
  const teamIndexes = subscribedIndexes.indexes.filter(isLikelyTeamIndex);

  const subs = subscribedIndexes.indexes.filter(
    (index) => !isLikelyTeamIndex(index)
  );

  const storedIndexes: StoredIndex[] = [];
  const indexData = await getIndexData();
  for (const index of teamIndexes) {
    storedIndexes.push({
      indexId: index.publicId,
      name: index.name,
      type: 'TEAM',
    });
  }
  for (const index of subs) {
    storedIndexes.push({
      indexId: index.publicId,
      name: index.name,
      type: 'SUBSCRIPTION',
    });
  }

  // Wipe existing indexes
  await deleteIndexData();
  // Save the indexes
  await setIndexData({
    activeIndex: indexData?.activeIndex,
    indexes: storedIndexes,
  });
}

// On load
chrome.runtime.onStartup.addListener(async () => {
  await fetchIndexes();
});

// Checks if an index is likely to be the team's index.
// This is a heuristic, and not guaranteed to be correct.
export function isLikelyTeamIndex(index: Index): boolean {
  return !index.public && index.name.startsWith('(Team)');
}
