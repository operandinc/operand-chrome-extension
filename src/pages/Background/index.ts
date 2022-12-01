// The background worker for the extension
// Handles a variety of events, including:
// - installs
// - uninstalls
// - omnibox events and queries

import { getApiKey, getRules, getSettings, setSettings } from '../../storage';
import { operandClient, ObjectService, ObjectType } from '@operandinc/sdk';

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
        console.log('Rules', rules);
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
