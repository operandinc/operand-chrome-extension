import { Combobox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { operandClient, OperandService, SearchResponse } from '@operandinc/sdk';
import * as React from 'react';
import {
  getApiKey,
  getIndexData,
  saveActiveIndex,
  StoredIndex,
} from '../../../storage';
import { CardMap } from '../cardmap';
import '../content.styles.css';
import { LoadingCard } from './cards';

const endpoint = 'https://api.operand.ai';

enum Status {
  NOKEY,
  LOADING,
  RESULTS,
  ERROR,
}

async function search(query: string, indexId?: string) {
  console.log('searching', query, indexId);
  var key = await getApiKey();
  if (!key) {
    return null;
  }
  // Fire the search
  const client = operandClient(OperandService, key, endpoint);
  const searchResponse = await client.search({
    query: query,
    limit: 5,
    indexIds: indexId ? [indexId] : undefined,
    attemptAnswer: false,
    objectOptions: {
      includePreview: true,
    },
  });
  console.log(searchResponse);
  return searchResponse;
}

const FakeEmptyIndex: StoredIndex = {
  indexId: '',
  name: 'All indexes',
  type: 'PERSONAL',
};

// Google search injection will be fixed size so as to not create a jarring experience.
// Users can expand the search to see more results and also choose in their settings how many results they want to see by default.
// Users can also narrow their search to a specific index.
export const Google: React.FC<{
  query: string;
  defaultResults: number;
}> = ({ query, defaultResults }) => {
  const [indexes, setIndexes] = React.useState<StoredIndex[]>([FakeEmptyIndex]);
  const [activeIndex, setActiveIndex] = React.useState<StoredIndex | null>(
    FakeEmptyIndex
  );
  const [indexQuery, setIndexQuery] = React.useState<string>('');
  const [searchResponse, setSearchResponse] = React.useState<SearchResponse>();
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<Status>(Status.LOADING);

  React.useEffect(() => {
    async function onLoad() {
      var key = await getApiKey();
      if (!key) {
        setStatus(Status.NOKEY);
        return null;
      }
      const indexData = await getIndexData();

      if (indexData) {
        // Scope search to a specific index
        setIndexes([FakeEmptyIndex, ...indexData.indexes]);
        const activeIndex = indexData.indexes.find(
          (idx) => idx.indexId === indexData.activeIndex
        );
        setActiveIndex(activeIndex ? activeIndex : FakeEmptyIndex);

        const res = await search(
          query,
          indexData.activeIndex ? indexData.activeIndex : undefined
        );
        if (res) {
          setSearchResponse(res);
          return;
        }
      } else {
        // Search all indexes
        const res = await search(query);
        if (res) {
          setSearchResponse(res);
          return;
        }
      }
    }
    onLoad();
  }, [query]);

  React.useEffect(() => {
    if (searchResponse) {
      if (searchResponse?.results && searchResponse?.results.length > 0) {
        setStatus(Status.RESULTS);
      } else {
        setStatus(Status.ERROR);
      }
    }
  }, [searchResponse]);

  React.useEffect(() => {
    if (activeIndex) {
      saveActiveIndex(activeIndex.indexId);
    }
  }, [activeIndex]);

  const filteredIndexes =
    indexQuery === '' || indexQuery === undefined
      ? indexes
      : indexes.filter((idx) => {
          return idx.name.toLowerCase().includes(indexQuery.toLowerCase());
        });

  return (
    <div className="w-full">
      {(status === Status.LOADING || status === Status.RESULTS) && (
        <Combobox
          value={activeIndex}
          onChange={async (idx: StoredIndex | null) => {
            setStatus(Status.LOADING);
            setActiveIndex(idx);
            if (idx && idx.indexId !== '') {
              console.log(idx.indexId);
              const res = await search(query, idx.indexId);
              if (res) {
                setSearchResponse(res);
              }
            } else {
              const res = await search(query, undefined);
              if (res) {
                setSearchResponse(res);
              }
            }
          }}
          nullable
        >
          <div className="flex justify-end w-full pb-4 px-4">
            <div className="flex items-center justify-end w-xs shadow-lg cursor-default border-primary-focus px-1 pt-1">
              <Combobox.Input
                className="input input-sm flex-grow focus:outline-none"
                onChange={(event) => setIndexQuery(event.target.value)}
                displayValue={(idx: StoredIndex | null) => {
                  return idx ? idx.name : '';
                }}
                value={indexQuery}
              />
              <Combobox.Button
                onClick={() => {
                  setIndexQuery('');
                  setActiveIndex(null);
                }}
                className="btn btn-square btn-sm"
              >
                <ChevronUpDownIcon className="h-6 w-6" />
              </Combobox.Button>
            </div>
          </div>
          <Combobox.Options className="max-h-52 w-full overflow-y-scroll overflow-x-hidden shadow-lg mb-4 p-2">
            <div className="menu menu-compact">
              {filteredIndexes.map((idx) => (
                <Combobox.Option key={idx.indexId} value={idx}>
                  {({ active, selected }) => (
                    <div
                      className={`${active ? 'active' : ''} ${
                        selected ? 'bg-info text-info-content' : ''
                      }`}
                    >
                      {idx.name}
                    </div>
                  )}
                </Combobox.Option>
              ))}
            </div>
          </Combobox.Options>
        </Combobox>
      )}
      {status === Status.NOKEY ? (
        <div className="w-full h-full flex flex-col justify-center items-center">
          <p>To get Operand search results you need to set your API Key.</p>
          <div
            className="btn btn-primary"
            onClick={() => {
              // Send a message to the background script to open the options page
              chrome.runtime.sendMessage({
                type: 'openOptions',
              });
            }}
          >
            Set Key
          </div>
        </div>
      ) : status === Status.LOADING ? (
        <div className="w-full space-y-4 pb-8">
          {/* Make number of loading cards based on default number of results */}
          {[...Array(defaultResults)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
          {defaultResults < 5 && (
            <div className="w-full divider p-4">
              <div
                className="btn btn-primary btn-sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Show more'}
              </div>
            </div>
          )}
        </div>
      ) : status === Status.RESULTS && searchResponse ? (
        <div className="w-full space-y-4 pb-8">
          {searchResponse.answer !== undefined ? <></> : null}
          {/* Only show the default amount of results and if there is answer subtract 1*/}
          {searchResponse.results
            ?.slice(
              0,
              expanded
                ? searchResponse.answer !== undefined
                  ? searchResponse.results?.length - 1
                  : searchResponse.results?.length
                : defaultResults
            )
            .map((result, i) => {
              // Get index and preview
              const index = searchResponse.indexes[result.indexId];
              const obj = searchResponse.objects[result.objectId];
              if (!obj || !index) {
                return null;
              }

              const card = CardMap.get(obj.type);
              if (card) {
                // Give the card a key and if we are only searching one index.
                return React.createElement(
                  card,
                  {
                    key: i,
                    index: index,
                    result: result,
                    object: obj,
                  },
                  null
                );
              }
            })}
          {searchResponse?.results.length > defaultResults && (
            <div className="w-full divider p-4">
              <div
                className="btn btn-primary btn-sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Show more'}
              </div>
            </div>
          )}
        </div>
      ) : status === Status.ERROR ? (
        <div className="w-full">
          <h1>No results found</h1>
          <p>Try a different search.</p>
        </div>
      ) : null}
    </div>
  );
};
