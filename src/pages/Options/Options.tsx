import { Tab } from '@headlessui/react';
import {
  IndexService,
  ListIndexesResponse,
  operandClient,
} from '@operandinc/sdk';
import React from 'react';
import {
  addRule,
  getRules,
  getSettings,
  removeRule,
  Rule,
  setSetting,
  setSettings,
  Settings,
} from '../../storage';
import './Options.css';

const Options: React.FC = () => {
  const [data, setData] = React.useState<Settings>({
    apiKey: '',
    searchInjectionEnabled: false,
    automaticIndexingEnabled: false,
    automaticIndexingDestination: '',
    manualIndexingMostRecentDestination: '',
    defaultResults: 1,
  });
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [domain, setDomain] = React.useState<string>('');
  const [indexes, setIndexes] = React.useState<ListIndexesResponse>();
  React.useEffect(() => {
    async function onLoad() {
      const settings = await getSettings();
      if (!settings) {
        return null;
      }
      setData(settings);
      const rules = await getRules();
      if (!rules) {
        return null;
      }
      setRules(rules);
    }
    onLoad();
  }, []);

  React.useEffect(() => {
    async function onChange() {
      // If the settings change, save them to storage
      setSettings(data);
      if (data?.automaticIndexingEnabled && data?.apiKey) {
        const indexClient = operandClient(
          IndexService,
          data.apiKey,
          'https://api.operand.ai'
        );

        const indexes = await indexClient.listIndexes({});
        setIndexes(indexes);
      }
    }
    onChange();
  }, [data]);

  console.log('data', data);
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

              <Tab>
                {({ selected }) => (
                  <div
                    className={`tab tab-bordered ${
                      selected ? 'tab-active' : ''
                    }`}
                  >
                    Rules
                  </div>
                )}
              </Tab>
            </div>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <h2>API Key</h2>
              <p>
                Your API Key lets the extension access your Operand account. You
                can find it{' '}
                <span
                  className="link"
                  onClick={() =>
                    chrome.tabs.create({
                      url: 'https://operand.ai/profile',
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
                }}
                autoFocus={true}
                placeholder="paste your api key here"
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

                  <h3>Automatic Indexing</h3>
                  <p>
                    Automatically send your public browsing data to an Operand
                    index. We only send the URL of the pages you visit so only
                    public websites are indexed.
                  </p>
                  <input
                    type="checkbox"
                    onChange={async (e) => {
                      await setSetting(
                        'automaticIndexingEnabled',
                        e.target.checked
                      );
                      const settings = await getSettings();
                      if (settings) {
                        setData(settings);
                      }
                    }}
                    className="toggle toggle-success"
                    checked={data.automaticIndexingEnabled}
                  />
                  {data.automaticIndexingEnabled && (
                    <div className="pl-4 border-l-2">
                      <h4>Destination Index</h4>
                      <p>
                        Please select the index you would like to send your
                        public browsing data to. We recommend using a private
                        index.
                      </p>
                      <select
                        className="select select-bordered	 w-full max-w-xs"
                        value={data.automaticIndexingDestination}
                        onChange={async (e) => {
                          await setSetting(
                            'automaticIndexingDestination',
                            e.target.value
                          );
                          const settings = await getSettings();
                          if (settings) {
                            setData(settings);
                          }
                        }}
                      >
                        {indexes?.indexes.map((index, i) => (
                          <option value={index.publicId} key={i}>{`${
                            index.public ? '(public)' : '(private)'
                          } ${index.name}`}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </Tab.Panel>
            <Tab.Panel>
              <h2>Rules</h2>
              <p>
                Rules let you control what domains are <b>automatically</b>{' '}
                indexed. You can add a domain like "example.com" and the
                extension won't index any pages from that domain. You can always
                index pages manually.
              </p>
              <input
                type="text"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                }}
                autoFocus={true}
                placeholder="example.com"
                className="input input-bordered w-full max-w-xs"
              />
              <button
                onClick={async () => {
                  if (domain !== '') {
                    var hostname = domain;
                    // Strip www. from the domain
                    if (domain.startsWith('www.')) {
                      hostname = domain.substring(4);
                    }
                    await addRule({
                      domain: hostname,
                      type: 'BLOCK',
                    });
                    const rules = await getRules();
                    if (rules) {
                      setRules(rules);
                    }
                    setDomain('');
                  }
                }}
                className="btn ml-4 btn-primary"
              >
                block domain
              </button>
              <div className="flex flex-wrap gap-2 w-full pt-4">
                {rules?.map((rule, i) => (
                  <div
                    key={i}
                    className="badge flex-shrink  gap-2 hover:cursor-pointer hover:badge-warning truncate"
                    onClick={async () => {
                      await removeRule(rule);
                      const rules = await getRules();
                      if (rules) {
                        setRules(rules);
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="inline-block w-4 h-4 stroke-current"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                    {rule.domain}
                  </div>
                ))}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Options;
