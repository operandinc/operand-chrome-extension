import { Combobox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { operandClient, OperandService, SearchResponse } from '@operandinc/sdk';
import * as React from 'react';
import { getApiKey, getIndexData, StoredIndex } from '../../../storage';
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
  var key = await getApiKey();
  if (!key) {
    return null;
  }
  // Fire the search
  const client = operandClient(OperandService, key, endpoint);
  const searchResponse = await client.search({
    query: query,
    limit: 8,
    indexIds: indexId ? [indexId] : undefined,
    attemptAnswer: false,
    objectOptions: {
      includePreview: true,
    },
  });
  console.log(searchResponse);
  return searchResponse;
}

// Google search injection will be fixed size so as to not create a jarring experience.
// Users can expand the search to see more results and also choose in their settings how many results they want to see by default.
// Users can also narrow their search to a specific index.
export const Google: React.FC<{
  query: string;
  defaultResults: number;
}> = ({ query, defaultResults }) => {
  const [indexes, setIndexes] = React.useState<StoredIndex[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<StoredIndex | null>(
    null
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
        setIndexes(indexData.indexes);
        const activeIndex = indexData.indexes.find(
          (idx) => idx.indexId === indexData.activeIndex
        );
        setActiveIndex(activeIndex ? activeIndex : null);
        const res = await search(query, indexData.activeIndex);
        if (res) {
          setSearchResponse(res);
        }
      } else {
        // Search all indexes
        const res = await search(query);
        if (res) {
          setSearchResponse(res);
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

  const filteredIndexes =
    indexQuery === ''
      ? indexes
      : indexes.filter((idx) => {
          return idx.name.toLowerCase().includes(indexQuery.toLowerCase());
        });

  return (
    // Remove any other css classes that may be present
    <div className="w-full">
      {status === Status.NOKEY ? (
        <div className="w-full h-full flex justify-center items-center">
          <h1>No API key found</h1>
          <p>Please add an API key in the settings page.</p>
        </div>
      ) : status === Status.LOADING ? (
        <div className="w-full space-y-4 pb-8">
          {/* Make number of loading cards based on default number of results */}
          {[...Array(defaultResults)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
          <div className="w-full divider pt-4">
            <button
              className="btn btn-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
      ) : status === Status.RESULTS && searchResponse ? (
        <div className="w-full space-y-4 pb-8">
          <Combobox value={activeIndex} onChange={setActiveIndex}>
            <div className="flex justify-end w-full">
              <div className="flex items-center justify-end w-xs shadow-lg cursor-default border-primary-focus">
                <Combobox.Input
                  className="input input-sm flex-grow focus:outline-none"
                  onChange={(event) => setIndexQuery(event.target.value)}
                  displayValue={(idx: StoredIndex | null) => {
                    if (idx) {
                      return idx.name;
                    } else {
                      if (indexQuery === '') {
                        return 'All indexes';
                      } else {
                        return indexQuery;
                      }
                    }
                  }}
                />
                <Combobox.Button
                  onClick={() => {
                    setIndexQuery('');
                  }}
                  className="btn btn-square btn-sm"
                >
                  <ChevronUpDownIcon className="h-6 w-6" />
                </Combobox.Button>
              </div>
            </div>
            <Combobox.Options className="menu shadow-lg menu-compact">
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
            </Combobox.Options>
          </Combobox>

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
                // Give the card a key and if we are only search one index.
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
          <div className="w-full divider pt-4">
            <button
              className="btn btn-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
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
