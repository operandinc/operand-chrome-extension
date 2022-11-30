import React from 'react';
import './Popup.css';
import {
  HomeIcon,
  AdjustmentsVerticalIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ChevronDoubleDownIcon,
} from '@heroicons/react/24/solid';
import {
  operandClient,
  ObjectType,
  ObjectService,
  IndexService,
  ListIndexesResponse,
} from '@operandinc/sdk';
import { getApiKey, getSetting, setSetting } from '../../storage';

const Popup = () => {
  const [query, setQuery] = React.useState<string>('');
  const [apiKey, setApiKey] = React.useState<string>('');
  const [destinationIndex, setDestinationIndex] = React.useState<string>('');
  const [sending, setSending] = React.useState<boolean>(false);
  const [sendingFinished, setSendingFinished] = React.useState<boolean>(false);
  const [indexes, setIndexes] = React.useState<ListIndexesResponse>();

  React.useEffect(() => {
    async function onLoad() {
      // If the settings change, save them to storage
      const mostRecent = await getSetting(
        'manualIndexingMostRecentDestination'
      );
      if (mostRecent && typeof mostRecent == 'string') {
        setDestinationIndex(mostRecent);
      }
      const apiKey = await getApiKey();
      if (!apiKey) {
        return null;
      }
      setApiKey(apiKey);
      const indexClient = operandClient(
        IndexService,
        apiKey,
        'https://api.operand.ai'
      );
      const indexes = await indexClient.listIndexes({});
      setIndexes(indexes);
    }
    onLoad();
  }, []);
  function search() {
    if (query !== '') {
      chrome.tabs.create({
        url: `https://operand.ai/feed?q=${query}`,
      });
    }
  }
  return (
    <div className="flex flex-col w-80 h-80 p-2">
      {apiKey ? (
        <>
          <div className="flex justify-between gap-2">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="search with operand"
                  className="input input-bordered w-full"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      search();
                    }
                  }}
                />
                <button
                  onClick={() => {
                    search();
                  }}
                  className="btn btn-square"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div
              className="btn btn-outline btn-square"
              onClick={() => {
                chrome.tabs.create({
                  url: `https://operand.ai/profile`,
                });
              }}
            >
              <UserIcon className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="flex-grow flex flex-col pt-4 items-center space-y-4">
            <div
              className={`btn btn-primary ${sending ? 'loading' : ''}`}
              onClick={async () => {
                // Get the current tab
                setSending(true);
                const tab = await chrome.tabs.query({
                  active: true,
                  currentWindow: true,
                });
                if (tab.length === 0) {
                  return;
                }
                const client = operandClient(
                  ObjectService,
                  apiKey,
                  'https://api.operand.ai'
                );
                if (!tab[0].url) {
                  return;
                }
                // Clean up the URL
                const url = new URL(tab[0].url);
                const cleanUrl = `${url.protocol}//${url.host}${url.pathname}`;
                setSetting(
                  'manualIndexingMostRecentDestination',
                  destinationIndex
                );
                await client.upsert(
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
                      'Operand-Index-Id': destinationIndex,
                    },
                  }
                );
                setSending(false);
                setSendingFinished(true);
                setTimeout(() => {
                  setSendingFinished(false);
                }, 2000);
              }}
            >
              {sendingFinished ? 'sent!' : 'send to index'}
            </div>
            <ChevronDoubleDownIcon className="w-8 h-8" aria-hidden="true" />
            <select
              className="select select-bordered"
              onChange={async (e) => {
                setDestinationIndex(e.target.value);
              }}
              value={destinationIndex}
            >
              {indexes?.indexes.map((index, i) => (
                <option key={i} value={index.publicId}>{`${
                  index.public ? '(public)' : '(private)'
                } ${index.name}`}</option>
              ))}
            </select>
          </div>
          <div className="flex-none btm-nav">
            <button className="active">
              <HomeIcon className="w-5 h-5" />
            </button>

            <button
              className="active"
              onClick={() => {
                chrome.runtime.openOptionsPage();
              }}
            >
              <AdjustmentsVerticalIcon className="w-5 h-5" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-grow flex flex-col text-center prose pt-4 items-center space-y-4">
          <h4>
            You need to set your API key in the extension settings before you
            can use the extension.
          </h4>
          <div
            className="btn btn-primary"
            onClick={() => {
              chrome.runtime.openOptionsPage();
            }}
          >
            set api key
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;
