// Functions to interact with the browser storage

export type Settings = {
  apiKey: string;
  searchInjectionEnabled: boolean;
  defaultResults: number;
  parentId: string;
  overrideNewTab: boolean;
  firstName: string;
};

async function validateSettings(settings: Settings) {
  const booleanSettings: (keyof Settings)[] = [
    'searchInjectionEnabled',
    'overrideNewTab',
  ];
  const stringSettings: (keyof Settings)[] = [
    'apiKey',
    'parentId',
    'firstName',
  ];

  const numberSettings: (keyof Settings)[] = ['defaultResults'];

  for (const key of booleanSettings) {
    // If the setting is defined and is not a boolean
    if (settings[key] !== undefined && typeof settings[key] !== 'boolean') {
      return false;
    }
  }

  for (const key of stringSettings) {
    // If the setting is defined and is not a string
    if (settings[key] !== undefined && typeof settings[key] !== 'string') {
      return false;
    }
  }

  for (const key of numberSettings) {
    // If the setting is defined and is not a number
    if (settings[key] !== undefined && typeof settings[key] !== 'number') {
      return false;
    }
  }

  return true;
}

// Get the entire settings object
export async function getSettings() {
  const storage = await chrome.storage.sync.get('settings');
  // Assert that the settings object exists
  if (!storage) {
    return null;
  }
  const settings: Settings = storage.settings;
  if (!settings) {
    return null;
  }
  // Validate the settings object
  if (await validateSettings(settings)) {
    return settings;
  } else {
    return null;
  }
}

// Get a specific setting
export async function getSetting(key: keyof Settings) {
  const settings = await getSettings();
  if (!settings) {
    return null;
  }
  return settings[key];
}

export async function getApiKey() {
  const key = await getSetting('apiKey');
  if (!key) {
    return null;
  }
  // Assert that the key is a string
  if (typeof key !== 'string') {
    return null;
  }
  // Assert that the key is not empty
  if (key.length === 0) {
    return null;
  }
  return key;
}

export async function getSearchInjectionEnabled() {
  const enabled = await getSetting('searchInjectionEnabled');
  if (enabled === null) {
    return false;
  }
  // Assert that the key is a string
  if (typeof enabled !== 'boolean') {
    return false;
  }
  return enabled;
}

export async function getDefaultResults() {
  const defaultResults = await getSetting('defaultResults');
  if (defaultResults === null) {
    return 1;
  }
  // Assert that the key is a string
  if (typeof defaultResults !== 'number') {
    return 1;
  }
  return defaultResults;
}

export async function getParentId() {
  const folderId = await getSetting('parentId');
  if (folderId === null) {
    return 'home';
  }
  // Assert that the key is a string
  if (typeof folderId !== 'string') {
    return 'home';
  }
  return folderId;
}

export async function getOverrideNewTab() {
  const overrideNewTab = await getSetting('overrideNewTab');
  if (overrideNewTab === null) {
    return false;
  }
  // Assert that the key is a string
  if (typeof overrideNewTab !== 'boolean') {
    return false;
  }
  return overrideNewTab;
}

export async function getFirstName() {
  const firstName = await getSetting('firstName');
  if (firstName === null) {
    return '';
  }
  // Assert that the key is a string
  if (typeof firstName !== 'string') {
    return '';
  }
  return firstName;
}

// Set the entire settings object
export async function setSettings(settings: Settings) {
  if (await validateSettings(settings)) {
    await chrome.storage.sync.set({ settings });
    return true;
  } else {
    return false;
  }
}

// Set a specific setting
export async function setSetting(key: keyof Settings, value: any) {
  const settings = await getSettings();
  if (!settings) {
    return false;
  }
  switch (key) {
    case 'searchInjectionEnabled':
      if (typeof value !== 'boolean') {
        return false;
      }
      settings.searchInjectionEnabled = value;
      break;
    case 'apiKey':
      if (typeof value !== 'string') {
        return false;
      }
      settings.apiKey = value;
      break;
    case 'defaultResults':
      if (typeof value !== 'number') {
        return false;
      }
      settings.defaultResults = value;
      break;
    case 'parentId':
      if (typeof value !== 'string') {
        return false;
      }
      settings.parentId = value;
      break;
    case 'overrideNewTab':
      if (typeof value !== 'boolean') {
        return false;
      }
      settings.overrideNewTab = value;
      break;
    case 'firstName':
      if (typeof value !== 'string') {
        return false;
      }
      settings.firstName = value;
      break;

    default:
      return false;
  }

  await setSettings(settings);
}
