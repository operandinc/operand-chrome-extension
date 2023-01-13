// Functions to interact with the browser storage

export type Settings = {
  apiKey: string;
  automaticIndexingEnabled: boolean;
  automaticIndexingDestination: string;
  searchInjectionEnabled: boolean;
  manualIndexingMostRecentDestination: string;
  defaultResults: number;
};

async function validateSettings(settings: Settings) {
  const booleanSettings: (keyof Settings)[] = [
    'searchInjectionEnabled',
    'automaticIndexingEnabled',
  ];
  const stringSettings: (keyof Settings)[] = [
    'apiKey',
    'automaticIndexingDestination',
    'manualIndexingMostRecentDestination',
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
    case 'automaticIndexingEnabled':
      if (typeof value !== 'boolean') {
        return false;
      }
      settings.automaticIndexingEnabled = value;
      break;
    case 'automaticIndexingDestination':
      if (typeof value !== 'string') {
        return false;
      }
      settings.automaticIndexingDestination = value;
      break;
    case 'manualIndexingMostRecentDestination':
      if (typeof value !== 'string') {
        return false;
      }
      settings.manualIndexingMostRecentDestination = value;
      break;
    case 'defaultResults':
      if (typeof value !== 'number') {
        return false;
      }
      settings.defaultResults = value;
      break;
    default:
      return false;
  }

  await setSettings(settings);
}

export type Rule = {
  domain: string;
  type: 'BLOCK';
};

export async function getRules() {
  const storage = await chrome.storage.sync.get('rules');
  // Assert that the rules object exists
  if (!storage) {
    return null;
  }
  const rules: Rule[] = storage.rules;
  // Validate the rules object
  if (Array.isArray(rules)) {
    return rules;
  } else {
    return null;
  }
}

export async function setRules(rules: Rule[]) {
  await chrome.storage.sync.set({ rules });
}

export async function addRule(rule: Rule) {
  const rules = await getRules();
  if (!rules) {
    // If there are no rules, create a new array
    await setRules([rule]);
  } else {
    // Otherwise, add the rule to the existing array
    await setRules([...rules, rule]);
  }
  return true;
}

export async function removeRule(rule: Rule) {
  const rules = await getRules();
  if (!rules) {
    return false;
  }
  const index = rules.findIndex((r) => r.domain === rule.domain);
  if (index === -1) {
    return false;
  }
  rules.splice(index, 1);
  await setRules(rules);
  return true;
}

export type StoredIndex = {
  indexId: string;
  name: string;
  type: 'TEAM' | 'PERSONAL' | 'SUBSCRIPTION';
};

export type IndexData = {
  activeIndex?: string;
  indexes: StoredIndex[];
};

export async function getIndexData() {
  const storage = await chrome.storage.sync.get('indexData');
  // Assert that the indexData object exists
  if (!storage) {
    return null;
  }
  const indexData: IndexData = storage.indexData;
  // Validate the indexData object
  if (indexData && typeof indexData === 'object') {
    return indexData;
  } else {
    return null;
  }
}

export async function setIndexData(indexData: IndexData) {
  await chrome.storage.sync.set({ indexData });
}

export async function deleteIndexData() {
  await chrome.storage.sync.remove('indexData');
}

export async function saveActiveIndex(indexId?: string) {
  const indexData = await getIndexData();
  if (!indexData) {
    return false;
  }
  indexData.activeIndex = indexId;
  await setIndexData(indexData);
  return true;
}
