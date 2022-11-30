import { Timestamp } from '@bufbuild/protobuf';
import {
  DocumentIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import {
  FeedResponse,
  Object$,
  ObjectType,
  operandClient,
  OperandService,
  SearchResponse,
} from '@operandinc/sdk';
import React from 'react';
import { getApiKey } from '../../storage';
import './Newtab.css';

const PreviewImage: React.FC<{ object?: Object$ }> = ({ object }) => {
  if (!object) {
    return null;
  }
  if (object.preview?.image) {
    return (
      <img src={object.preview.image} alt={`for ${object.preview.title}`} />
    );
  }
  switch (object.type) {
    case ObjectType.TEXT:
      return <DocumentIcon className="w-12 text-gray-400" aria-hidden="true" />;
    default:
      return <LinkIcon className="w-12 text-gray-400" aria-hidden="true" />;
  }
};

const Newtab = () => {
  const [feed, setFeed] = React.useState<FeedResponse>();
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [apiKey, setApiKey] = React.useState<string>();
  const [searchResults, setSearchResults] =
    React.useState<SearchResponse | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const currentTime = Timestamp.now();
  React.useEffect(() => {
    async function onLoad() {
      var apiKey = await getApiKey();
      if (!apiKey) {
        return null;
      }
      setApiKey(apiKey);
      const client = operandClient(
        OperandService,
        apiKey as string,
        'https://api.operand.ai'
      );
      const feed = await client.feed({
        objectOptions: {
          includePreview: true,
        },
        paginationParams: {
          limit: 10,
          offset: 0,
          latestTime: currentTime,
        },
      });
      setFeed(feed);
    }
    onLoad();
  }, []);

  React.useEffect(() => {
    if (!apiKey || searchQuery == '') {
      setSearchResults(null);
      return;
    }

    const firedQuery = searchQuery;
    const timeout = setTimeout(async () => {
      setLoadingSearch(true);
      const client = operandClient(
        OperandService,
        apiKey,
        'https://api.operand.ai'
      );
      const results = await client.search({
        query: searchQuery,
        limit: 8,
        attemptAnswer: true,
        objectOptions: {
          includePreview: true,
        },
      });
      if (firedQuery == searchQuery) {
        setSearchResults(results);
      }
      setLoadingSearch(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, apiKey]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20">
      <div className="mx-auto max-w-2xl">
        {apiKey ? (
          <>
            <div className="flex justify-between">
              <div className="prose">
                <h2>the latest from your corner of the internet</h2>
              </div>
              <a href="https://operand.ai/profile">
                <div className="btn btn-outline btn-square">
                  <UserIcon className="w-5 h-5" aria-hidden="true" />
                </div>
              </a>
            </div>
            <div className="flex flex-col items-start w-full">
              <div className="form-control w-1/2">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="search with operand"
                    className="input input-bordered w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-square">
                    <MagnifyingGlassIcon
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </div>
            {loadingSearch ? (
              <div className="flex w-full h-screen items-center justify-center">
                <button className="btn btn-square loading"></button>
              </div>
            ) : searchResults ? (
              <div className="mt-8">
                {searchResults.answer && (
                  <div className="card card-compact shadow-xl bg-primary mb-4">
                    <div className="card-body w-full">
                      <h2 className="card-title">answer</h2>
                      <p className="text-lg">{searchResults.answer?.answer}</p>
                    </div>
                  </div>
                )}
                {searchResults.results.map((result, i) => (
                  <div className="card card-compact" key={i}>
                    <div className="card-body w-full">
                      <a
                        href={`https://operand.ai/indexes/${result.indexId}/${result.objectId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:cursor-pointer"
                      >
                        <p className="text-lg">{result.content}</p>
                      </a>
                      <a
                        href={`https://operand.ai/indexes/${result.indexId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-none"
                      >
                        <div className="btn btn-sm btn-outline">
                          {searchResults.indexes[result.indexId]
                            ? searchResults.indexes[result.indexId].name
                            : 'error getting index name'}
                        </div>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : feed ? (
              <div className="mt-4">
                <div className="py-4">
                  {feed.feedObjects.map((result, i) => (
                    <div key={i} className="flex items-center space-x-4 py-4">
                      <PreviewImage object={result.object} />
                      <div className="card card-compact w-full card-side">
                        <div className="card-body">
                          <h2 className="card-title flex justify-between">
                            <a
                              href={`https://operand.ai/indexes/${result.indexId}/${result.object?.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link"
                            >
                              {result.object?.preview?.title}
                            </a>
                            <a
                              href={`https://operand.ai/indexes/${result.indexId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-none"
                            >
                              <div className="btn btn-sm btn-outline">
                                {feed?.indexes[result.indexId]?.name}
                              </div>
                            </a>
                          </h2>
                          <p className="text-sm">
                            {result.object?.preview?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Load More button */}
                <div className="w-full flex items-center justify-center">
                  <div
                    onClick={async () => {
                      if (!apiKey) {
                        return;
                      }
                      setLoadingMore(true);
                      const client = operandClient(
                        OperandService,
                        apiKey,
                        'https://api.operand.ai'
                      );
                      const res = await client.feed({
                        objectOptions: {
                          includePreview: true,
                        },
                        paginationParams: {
                          limit: 10,
                          offset: feed.feedObjects.length,
                          latestTime: currentTime,
                        },
                      });
                      setFeed((existing) =>
                        existing
                          ? new FeedResponse({
                              ...existing,
                              indexes: {
                                ...existing.indexes,
                                ...res.indexes,
                              },
                              feedObjects: [
                                ...existing.feedObjects,
                                ...res.feedObjects,
                              ],
                            })
                          : res
                      );
                      setLoadingMore(false);
                    }}
                    className={`btn btn-primary ${
                      loadingMore ? 'loading' : ''
                    }`}
                  >
                    {loadingMore ? 'loading...' : 'load more'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex w-full h-screen items-center justify-center">
                <button className="btn btn-square loading"></button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col w-full h-96 items-center justify-center space-y-10">
            <div className="prose">
              <h2>please add your API key to use the extension</h2>
            </div>
            <div
              onClick={() => {
                chrome.runtime.openOptionsPage();
              }}
              className="btn btn-primary"
            >
              open options
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Newtab;
