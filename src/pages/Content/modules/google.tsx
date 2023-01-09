import {
  ContentSnippet,
  operandClient,
  OperandService,
  SearchResponse,
} from '@operandinc/sdk';
import * as React from 'react';
import { getApiKey, getTeamData, setActiveTeamId } from '../../../storage';

import '../content.styles.css';

export const Google: React.FC<{
  query: string;
}> = ({ query }) => {
  const [searchResponse, setSearchResponse] =
    React.useState<SearchResponse | null>(null);
  const [teams, setTeams] = React.useState<
    {
      name: string;
      indexPublicId: string;
    }[]
  >([]);
  const [activeTeam, setActiveTeam] = React.useState<string | undefined>(
    undefined
  );
  enum Status {
    NOKEY,
    LOADING,
    ANSWER,
    RESULTS,
    ERROR,
  }
  const [status, setStatus] = React.useState<Status>(Status.LOADING);
  const search = async (query: string, indexId?: string) => {
    var key = await getApiKey();
    if (!key) {
      setStatus(Status.NOKEY);
      return null;
    }
    // Fire the search
    const client = operandClient(OperandService, key, 'https://api.operand.ai');
    const searchResponse = await client.search({
      query: query,
      limit: 2,
      indexIds: indexId ? [indexId] : undefined,
      attemptAnswer: false,
      objectOptions: {
        includePreview: true,
      },
    });
    setSearchResponse(searchResponse);
  };

  React.useEffect(() => {
    async function onLoad() {
      var key = await getApiKey();
      if (!key) {
        setStatus(Status.NOKEY);
        return null;
      }
      const teamData = await getTeamData();
      if (teamData) {
        setTeams(teamData.teams);
        setActiveTeam(teamData.activeTeamId);
        await search(query, teamData.activeTeamId);
      } else {
        await search(query);
      }
    }
    onLoad();
  }, [query, Status.NOKEY]);

  React.useEffect(() => {
    if (searchResponse) {
      if (
        searchResponse?.answer?.answer &&
        searchResponse?.answer?.answer.length > 0
      ) {
        setStatus(Status.ANSWER);
      } else if (
        searchResponse?.results &&
        searchResponse?.results.length > 0
      ) {
        setStatus(Status.RESULTS);
      } else {
        setStatus(Status.ERROR);
      }
    }
  }, [searchResponse]);

  return (
    <div>
      {/* Operand Section */}
      <div className="w-full h-40 pb-3 overflow:hidden">
        <div className="flex justify-between items-center h-6 pb-1 text-base text-black dark:text-white ">
          <p>Operand Results:</p>
          {teams.length > 0 && (
            <select
              className="text-sm text-black dark:text-white bg-transparent border-none"
              onChange={async (e) => {
                setStatus(Status.LOADING);
                setActiveTeam(
                  e.target.value === 'undefined' ? undefined : e.target.value
                );
                search(
                  query,
                  e.target.value === 'undefined' ? undefined : e.target.value
                );
                setActiveTeamId(
                  e.target.value === 'undefined' ? undefined : e.target.value
                );
              }}
              value={activeTeam}
            >
              <option value={'undefined'}>select team</option>
              {teams.map((team) => (
                <option key={team.indexPublicId} value={team.indexPublicId}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="w-full h-28">
          {status === Status.NOKEY ? (
            <div className="flex  flex-col items-center justify-center w-full h-28">
              <p>To get search results you need to set your API Key</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  // Send a message to the background script to open the options page
                  chrome.runtime.sendMessage({
                    type: 'openOptions',
                  });
                }}
              >
                Set Key
              </button>
            </div>
          ) : status === Status.LOADING ? (
            <div className="flex items-center justify-center w-full h-28">
              <p>Loading ...</p>
            </div>
          ) : status === Status.ANSWER ? (
            <div className="w-full h-full">
              {/* Answer */}
              <div className="text-sm text-gray-700 dark:text-gray-400 truncate h-4">
                Generated Answer:
              </div>
              <div className="w-full h-16 py-2">
                <div className="line-clamp-3">
                  {searchResponse?.answer?.answer}
                </div>
              </div>
              <div className="w-full flex justify-start gap-2 h-5 pb-1">
                <div className="flex-none text-sm">Sources:</div>
                {/* Deduped results */}
                {searchResponse?.results &&
                  searchResponse.results
                    .reduce((acc: ContentSnippet[], result) => {
                      if (
                        result.objectId &&
                        !acc.find((r) => r.objectId === result.objectId)
                      ) {
                        acc.push(result);
                      }
                      return acc;
                    }, [])
                    .map((result, i) => (
                      <div className="text-sm truncate" key={i}>
                        <a
                          href={
                            searchResponse?.objects[result.objectId].preview
                              ?.url ||
                            `https://operand.ai/indexes/${result.indexId}/${result.objectId}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link text-sm truncate h-5"
                        >
                          {
                            searchResponse.objects[result.objectId].preview
                              ?.title
                          }
                        </a>
                      </div>
                    ))}
              </div>
            </div>
          ) : status === Status.RESULTS ? (
            <div className="w-full h-full">
              <div className="text-sm text-gray-700 dark:text-gray-400 truncate h-4">
                {
                  searchResponse?.objects[searchResponse.results[0].objectId]
                    .preview?.url
                }
              </div>
              <div className="h-6">
                <a
                  href={
                    searchResponse?.objects[searchResponse.results[0].objectId]
                      .preview?.url ||
                    `https://operand.ai/indexes${searchResponse?.results[0].indexId}/${searchResponse?.results[0].objectId}`
                  }
                  className="flex-grow text-blue-400 hover:underline hover:cursor-pointer text-lg truncate h-6"
                >
                  {
                    searchResponse?.objects[searchResponse.results[0].objectId]
                      .preview?.title
                  }
                </a>
              </div>
              <div className="py-1 h-12 text-sm overflow:hidden">
                <div className="line-clamp-2">
                  {searchResponse?.results[0].content}
                </div>
              </div>
              <div className="w-full h-5 pb-1">
                <div className="text-sm truncate">
                  <a
                    href={`https://operand.ai/indexes/${searchResponse?.results[0].indexId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none text-blue-400 hover:underline hover:cursor-pointer truncate h-5"
                  >
                    Source Index:{' '}
                    {searchResponse?.indexes[
                      searchResponse.results[0].indexId
                    ] &&
                      searchResponse.indexes[searchResponse.results[0].indexId]
                        .name}
                  </a>
                </div>
              </div>
            </div>
          ) : status === Status.ERROR ? (
            <div className="flex items-center justify-center w-full h-28">
              <div>No results found.</div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center w-full h-4 py-2 space-x-4">
          <div className="bg-gray-300 h-0.5 rounded flex-grow"></div>
        </div>
      </div>
    </div>
  );
};

export default Google;
