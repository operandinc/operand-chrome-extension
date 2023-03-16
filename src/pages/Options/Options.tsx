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
import './Options.css';

const Options: React.FC = () => {
  const [data, setData] = React.useState<Settings>({
    apiKey: '',
    searchInjectionEnabled: false,
    overrideNewTab: false,
    defaultResults: 1,
    parentId: '',
    firstName: '',
  });
  // Null means root folder
  const [defaultFolder, setDefaultFolder] = React.useState<File | null>(null);
  const [viewingFolder, setViewingFolder] = React.useState<File | null>(null);
  const [children, setChildren] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  async function getChildren(parentId: string, apiKey: string) {
    setLoading(true);
    const client = operandClient(FileService, apiKey, endpoint);
    try {
      const res = await client.listFiles({
        filter: {
          parentId: parentId,
        },
        returnOptions: {
          includeParents: true,
        },
      });
      if (res.files) {
        setChildren(res.files.filter((f) => !f.sizeBytes));
      }
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  }

  async function getDefaultFolder(
    apiKey: string,
    children: boolean,
    parentId: string
  ) {
    const client = operandClient(FileService, apiKey, endpoint);
    if (parentId === '') {
      setDefaultFolder(null);
      if (children) {
        getChildren('', apiKey);
      }
      return;
    }
    try {
      const res = await client.getFile({
        selector: {
          selector: {
            case: 'id',
            value: parentId,
          },
        },
      });
      if (res.file) {
        setDefaultFolder(res.file);
      }
    } catch (e) {
      console.log(e);
    }

    if (children) {
      getChildren('', apiKey);
    }
  }

  React.useEffect(() => {
    async function onLoad() {
      const settings = await getSettings();
      if (!settings) {
        return null;
      }
      setData(settings);
      if (settings.apiKey !== '') {
        getDefaultFolder(settings.apiKey, true, settings.parentId);
      }
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
                  getDefaultFolder(e.target.value, true, data.parentId);
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
                  <h3>Default Results Shown</h3>
                  <p>
                    Choose how many results you would like to see by default.
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
                  <h3>Default Folder</h3>
                  <p>
                    By default Operand will search over all of your files. Here
                    you can choose a specific folder to search within by
                    default.
                  </p>
                  {defaultFolder && (
                    <b>Current Default Folder: {defaultFolder.name}</b>
                  )}
                  <div className="border p-4 my-4">
                    <p>
                      Currently Viewing:{' '}
                      {viewingFolder ? viewingFolder.name : 'Home Folder'}
                    </p>
                    {loading ? (
                      <p>Loading...</p>
                    ) : (
                      <>
                        {children.length > 0 ? (
                          <ul className="menu">
                            <li className="menu-title">
                              <span>Subfolders:</span>
                            </li>

                            {children.map((child) => (
                              <li
                                onClick={async () => {
                                  // View the folder
                                  setViewingFolder(child);
                                  getChildren(child.id, data.apiKey);
                                }}
                                key={child.id}
                              >
                                <a>{child.name}</a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>This folder has no subfolders.</p>
                        )}
                      </>
                    )}

                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => {
                          setViewingFolder(null);
                          getChildren('', data.apiKey);
                        }}
                        className={`btn btn-sm ${
                          viewingFolder ? 'btn-outline' : 'btn-disabled'
                        }`}
                      >
                        Back to Home
                      </button>

                      <button
                        onClick={async () => {
                          // Set the default folder
                          if (viewingFolder) {
                            await setSettings({
                              ...data,
                              parentId: viewingFolder.id,
                            });
                            const settings = await getSettings();
                            if (settings) {
                              setData(settings);
                            }
                            setDefaultFolder(viewingFolder);
                          } else {
                            await setSettings({
                              ...data,
                              parentId: '',
                            });

                            const settings = await getSettings();
                            if (settings) {
                              setData(settings);
                            }
                            setDefaultFolder(null);
                          }
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        Set {viewingFolder ? viewingFolder.name : 'Home'} as
                        Default
                      </button>
                    </div>
                  </div>

                  {/* Folder Browser Component*/}
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
