import { Tab } from '@headlessui/react';
import {
  File,
  FileService,
  operandClient,
  TenantService,
} from '@operandinc/sdk';
import React from 'react';
import { endpoint } from '../../environment';
import { getSettings, setSetting, setSettings, Settings } from '../../storage';
import FileBrowser from './browser';
import './Options.css';

const Options: React.FC = () => {
  const [data, setData] = React.useState<Settings>({
    apiKey: '',
    searchInjectionEnabled: false,
    overrideNewTab: false,
    defaultResults: 1,
    parentId: '',
    firstName: '',
    answersEnabled: false,
    automaticIndexing: false,
    automaticIndexingFolderId: '',
  });
  // Null means root folder
  const [defaultFolder, setDefaultFolder] = React.useState<File | null>(null);
  const [automaticIndexingFolder, setAutomaticIndexingFolder] =
    React.useState<File | null>(null);

  async function getDefaultFolder(apiKey: string, parentId: string) {
    if (parentId === '') {
      setDefaultFolder(null);
      return null;
    }
    const client = operandClient(FileService, apiKey, endpoint);
    const res = await client.getFile({
      selector: {
        selector: {
          case: 'id',
          value: parentId,
        },
      },
    });
    setDefaultFolder(res.file || null);
  }

  async function getAutomaticIndexingFolder(apiKey: string, folderId: string) {
    if (folderId === '') {
      setAutomaticIndexingFolder(null);
      return null;
    }
    const client = operandClient(FileService, apiKey, endpoint);
    const res = await client.getFile({
      selector: {
        selector: {
          case: 'id',
          value: folderId,
        },
      },
    });
    setAutomaticIndexingFolder(res.file || null);
  }

  React.useEffect(() => {
    async function onLoad() {
      const settings = await getSettings();
      if (!settings) {
        return null;
      }
      setData(settings);
      await getDefaultFolder(settings.apiKey, settings.parentId);
      await getAutomaticIndexingFolder(
        settings.apiKey,
        settings.automaticIndexingFolderId
      );
    }
    onLoad();
  }, []);

  React.useEffect(() => {
    async function onChange() {
      // If the settings change, save them to storage
      setSettings(data);
    }
    onChange();
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-3xl prose prose-sm">
        <Tab.Group>
          <h1>Operand Chrome Extension</h1>
          <Tab.List>
            <div className="tabs">
              <Tab>
                {({ selected }) => (
                  <div
                    className={`tab tab-bordered  ${
                      selected ? 'tab-active' : ''
                    }`}
                  >
                    Settings
                  </div>
                )}
              </Tab>
            </div>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <h2>Chrome Extension Code</h2>
              <p>
                Your code lets the extension access your Operand account. You
                can find it{' '}
                <span
                  className="link"
                  onClick={() =>
                    chrome.tabs.create({
                      url: 'https://operand.ai/interfaces?tab=chrome',
                    })
                  }
                >
                  here
                </span>{' '}
                on your dashboard.
              </p>
              <input
                type="text"
                value={data.apiKey}
                onChange={async (e) => {
                  setData({ ...data, apiKey: e.target.value });
                  chrome.runtime.sendMessage({
                    type: 'setApiKey',
                  });
                  await getDefaultFolder(e.target.value, data.parentId);
                }}
                autoFocus={true}
                placeholder="paste your code here"
                className="input input-bordered w-full max-w-md"
              />
              {data.apiKey !== '' && (
                <div>
                  <h2>Options</h2>
                  <p>Personalize your experience with Operand!</p>
                  <h3>Search Injection</h3>
                  <p>
                    Search injection adds Operand search results into the places
                    where you already search.
                  </p>
                  <input
                    type="checkbox"
                    onChange={async (e) => {
                      await setSetting(
                        'searchInjectionEnabled',
                        e.target.checked
                      );
                      const settings = await getSettings();
                      if (settings) {
                        setData(settings);
                      }
                    }}
                    className="toggle toggle-success"
                    checked={data.searchInjectionEnabled}
                  />
                  {data.searchInjectionEnabled && (
                    <>
                      <h3>Answers</h3>
                      <p>
                        Rather than just showing you files, Operand can also
                        show you direct answers to your questions.
                      </p>
                      <input
                        type="checkbox"
                        onChange={async (e) => {
                          await setSetting('answersEnabled', e.target.checked);
                          const settings = await getSettings();
                          if (settings) {
                            setData(settings);
                          }
                        }}
                        className="toggle toggle-success"
                        checked={data.answersEnabled}
                      />

                      <h3>Default Results Shown</h3>
                      <p>
                        Choose how many results you would like to see by
                        default.
                      </p>
                      <div className="flex justify-start items-center gap-4">
                        {/* Create options 1-5 */}
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex flex-col items-center">
                            <input
                              type="radio"
                              name="defaultResults"
                              className="radio"
                              checked={data.defaultResults === i}
                              onChange={async (e) => {
                                await setSetting('defaultResults', i);
                                const settings = await getSettings();
                                if (settings) {
                                  setData(settings);
                                }
                              }}
                            />
                            <p>{i}</p>
                          </div>
                        ))}
                      </div>
                      <h3>Default Search Folder</h3>
                      <p>
                        By default Operand will search over all of your files.
                        Here you can choose a specific folder to search within
                        by default.
                      </p>
                      {defaultFolder && (
                        <b>Current Default Folder: {defaultFolder.name}</b>
                      )}
                      <FileBrowser
                        apiKey={data.apiKey}
                        defaultFolder={defaultFolder}
                        callback={async (file) => {
                          // Set the default folder

                          await setSettings({
                            ...data,
                            parentId: file?.id || '',
                          });
                          const settings = await getSettings();
                          if (settings) {
                            setData(settings);
                          }
                          setDefaultFolder(file || null);
                        }}
                        buttonText="default folder."
                      />
                    </>
                  )}
                  <h3>Automatic Indexing</h3>
                  <p>
                    Operand can automatically index the websites you visit and
                    add them to your account. This only adds publicly available
                    information and does not scrape your visits to any websites
                    that require a login.
                  </p>
                  <input
                    type="checkbox"
                    onChange={async (e) => {
                      await setSetting('automaticIndexing', e.target.checked);
                      const settings = await getSettings();
                      if (settings) {
                        setData(settings);
                      }
                    }}
                    className="toggle toggle-success"
                    checked={data.automaticIndexing}
                  />
                  {data.automaticIndexing && (
                    <>
                      <h4>Automatic Indexing Destination Folder</h4>
                      <p>
                        Choose a folder where all of the websites you visit will
                        be saved to.
                      </p>
                      {automaticIndexingFolder ? (
                        <b>
                          Current Automatic Indexing Folder:{' '}
                          {automaticIndexingFolder.name}
                        </b>
                      ) : (
                        <b>Current Automatic Indexing Folder: None</b>
                      )}
                      <FileBrowser
                        apiKey={data.apiKey}
                        defaultFolder={automaticIndexingFolder}
                        callback={async (file) => {
                          // Set the automatic indexing folder

                          await setSettings({
                            ...data,
                            automaticIndexingFolderId: file?.id || '',
                          });
                          const settings = await getSettings();
                          if (settings) {
                            setData(settings);
                          }
                          setAutomaticIndexingFolder(file || null);
                        }}
                        buttonText="automatic indexing folder."
                      />
                    </>
                  )}

                  <h3>[Beta] New Tab Chat</h3>
                  <p>
                    Changes your new tab page to a be chat interface with
                    Operand.
                  </p>
                  {/* Boolean Toggle */}
                  <input
                    type="checkbox"
                    onChange={async (e) => {
                      await setSetting('overrideNewTab', e.target.checked);
                      const settings = await getSettings();
                      if (settings) {
                        setData(settings);
                      }
                    }}
                    className="toggle toggle-success"
                    checked={data.overrideNewTab}
                  />
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Options;
