// The background worker for the extension
// Handles a variety of events, including:
// - installs
// - uninstalls
// - omnibox events and queries

import { FileService, operandClient, TenantService } from '@operandinc/sdk';
import { endpoint } from '../../environment';
import {
  getApiKey,
  getOverrideNewTab,
  getParentId,
  getSettings,
  setSettings,
} from '../../storage';

// On Install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Installed!');
  const settings = await getSettings();
  if (!settings) {
    // Set defaults
    await setSettings({
      apiKey: '',
      searchInjectionEnabled: true,
      defaultResults: 1,
      parentId: '',
      overrideNewTab: false,
      firstName: '',
      answersEnabled: false,
      automaticIndexing: false,
      automaticIndexingFolderId: '',
    });
  }
  // If the token is not set, open the options page
  const token = await getApiKey();
  if (!token || token === '') {
    chrome.runtime.openOptionsPage();
  }
});

// Ombnibox
chrome.omnibox.onInputEntered.addListener(async function (text) {
  if (!text) return;
  const scope = await getParentId();
  var newURL = 'https://operand.ai/search?q=' + text + '&s=' + scope;
  chrome.tabs.create({ url: newURL });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(async function (request) {
  // If the message is to open the options page
  if (request.type === 'openOptions') {
    chrome.runtime.openOptionsPage();
  }
  // If the message is to get the indexes
  else if (request.type === 'setApiKey') {
    await getName();
  }
});

const blockList = [
  'https://www.google.com/search',
  'https://operand.ai',
  'chrome:',
];

// On Tab Update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab) return;
  if (changeInfo.status === 'complete') {
    const settings = await getSettings();
    if (!settings) return;
    if (settings.automaticIndexing && settings.automaticIndexingFolderId) {
      // Check if the url is in the block list
      for (let i = 0; i < blockList.length; i++) {
        if (tab.url?.startsWith(blockList[i])) {
          return;
        }
      }
      // We send the url to the server to index
      try {
        const client = operandClient(FileService, settings.apiKey, endpoint);
        await client.importFromURL({
          url: tab.url,
          parentId: settings.automaticIndexingFolderId,
          importOptions: {
            smart: false,
            updateOnDuplicate: true,
            qualityFilter: 4,
          },
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  const overrideNewTab = await getOverrideNewTab();
  if (tab.pendingUrl === 'chrome://newtab/' && overrideNewTab && tab.id) {
    chrome.tabs.remove(tab.id);
    chrome.tabs.create({
      url: '/newtab.html',
    });
  }
});

async function getName() {
  const settings = await getSettings();
  if (!settings) {
    return;
  }
  if (!settings.apiKey || settings.apiKey === '') {
    console.log('no api key');
    return;
  }
  if (!settings.firstName || settings.firstName === '') {
    const client = operandClient(TenantService, settings.apiKey, endpoint);
    const tenant = await client.authorizedUser({});
    if (tenant.user?.profile?.firstName) {
      settings.firstName = tenant.user.profile.firstName;
      await setSettings(settings);
    }
  }
}

// On load
chrome.runtime.onStartup.addListener(async () => {
  await getName();
});
