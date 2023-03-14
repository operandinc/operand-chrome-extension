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

  chrome.alarms.create('testFolder', { periodInMinutes: 60 * 3 });
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

// On Alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'testFolder') {
    await testFolder();
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
    await testFolder();
    await getName();
  }
});

// // On Tab Update
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (!tab) return;

//   if (tab.url === 'chrome://newtab/' && overrideNewTab && tab.id) {
//     chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('/newtab.html') });
//   }
// });

chrome.tabs.onCreated.addListener(async (tab) => {
  const overrideNewTab = await getOverrideNewTab();
  if (tab.pendingUrl === 'chrome://newtab/' && overrideNewTab && tab.id) {
    chrome.tabs.remove(tab.id);
    chrome.tabs.create({
      url: '/newtab.html',
    });
  }
});

async function testFolder() {
  // We just want to ensure that the folder can be accessed by the user
  const settings = await getSettings();
  if (!settings) {
    return;
  }
  if (!settings.apiKey || settings.apiKey === '') {
    console.log('no api key');
    return;
  }
  if (!settings.parentId || settings.parentId === '') {
    console.log('default folder');
    return;
  } else {
    const client = operandClient(FileService, settings.apiKey, endpoint);

    try {
      await client.getFile({
        selector: {
          selector: {
            case: 'id',
            value: settings.parentId,
          },
        },
      });
      console.log('folder exists and is accessible');
    } catch (e) {
      console.log('folder does not exist or is not accessible');
      settings.parentId = '';
      await setSettings(settings);
    }
  }
}

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
  await testFolder();
});
