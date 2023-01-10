import {
  Answer,
  ContentSnippet,
  HTMLMetadata,
  Index,
  ObjectPreview,
  operandClient,
  OperandService,
  SearchResponse,
} from '@operandinc/sdk';
import * as React from 'react';
import { getApiKey, getIndexData, StoredIndex } from '../../../storage';
import { endpoint } from '../../Background';

import '../content.styles.css';

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
    limit: 5,
    indexIds: indexId ? [indexId] : undefined,
    attemptAnswer: false,
    objectOptions: {
      includePreview: true,
    },
  });
  return searchResponse;
}

// Displays a card for a result
const htmlResultCard: React.FC<{
  result: ContentSnippet;
  preview: ObjectPreview;
  metadata: HTMLMetadata;
  index: Index;
}> = ({ result, preview, metadata, index }) => {
  return <div></div>;
};

// Not used right now but will be used to display a card for an answer
const answerCard: React.FC<{
  answer: Answer;
}> = ({ answer }) => {
  return <div></div>;
};

// Google search injection will be fixed size so as to not create a jarring experience.
// Users can expand the search to see more results and also choose in their settings how many results they want to see by default.
// Users can also narrow their search to a specific index.
export const Google: React.FC<{
  query: string;
  defaultResults: number;
}> = ({ query }) => {
  const [indexes, setIndexes] = React.useState<StoredIndex[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<string | undefined>(
    undefined
  );
  const [searchResponse, setSearchResponse] =
    React.useState<SearchResponse | null>(null);
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
        setActiveIndex(indexData.activeIndex);
        await search(query, indexData.activeIndex);
      } else {
        // Search all indexes
        await search(query);
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

  return <div></div>;
};
