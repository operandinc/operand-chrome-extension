import {
  File,
  operandClient,
  OperandService,
  SearchResponse,
} from '@operandinc/sdk';
import * as React from 'react';
import { endpoint } from '../../../environment';
import { getApiKey, getParentId } from '../../../storage';
import '../content.styles.css';
import { FileResult, LoadingResult } from './results';

enum Status {
  NOKEY,
  LOADING,
  RESULTS,
  ERROR,
}

async function search(query: string, parentId: string) {
  var key = await getApiKey();
  if (!key) {
    return null;
  }
  // Fire the search
  const client = operandClient(OperandService, key, endpoint);
  const searchResponse = await client.search({
    query: query,
    maxResults: 5,
    parentId: parentId,
    fileReturnOptions: {
      includeParents: true,
    },
    adjacentSnippets: 1,
  });
  return searchResponse;
}

// Google search injection will be fixed size so as to not create a jarring experience.
// Users can expand the search to see more results and also choose in their settings how many results they want to see by default.
// Users can also narrow their search to a specific index.
export const Google: React.FC<{
  query: string;
  defaultResults: number;
}> = ({ query, defaultResults }) => {
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
      var parentId = await getParentId();

      const res = await search(query, parentId);
      if (res) {
        setSearchResponse(res);
        return;
      }
    }
    onLoad();
  }, [query]);

  React.useEffect(() => {
    if (searchResponse) {
      if (searchResponse.matches && searchResponse.matches.length > 0) {
        setStatus(Status.RESULTS);
      } else {
        setStatus(Status.ERROR);
      }
    }
  }, [searchResponse]);

  return (
    <div className="w-full">
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
            <LoadingResult key={i} />
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
          {searchResponse.matches
            .slice(0, expanded ? searchResponse.matches.length : defaultResults)
            .map((result, i) => {
              const file = searchResponse.files[result.fileId];
              var parent: File | undefined;
              if (file.parents.length > 0) {
                parent = file.parents[0];
              }
              return (
                <FileResult
                  key={i}
                  file={file}
                  parent={parent}
                  result={result}
                />
              );
            })}
          {searchResponse.matches.length > defaultResults && (
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
