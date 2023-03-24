import { FolderIcon } from '@heroicons/react/24/solid';
import { ContentMatch, File } from '@operandinc/sdk';
import * as React from 'react';
import { frontend } from '../../../environment';
import '../content.styles.css';
import { FileIcon } from './fileIcon';

/* Current types of cards
    - TextResultCard: Card for Text content
    - HtmlResultCard: Card for HTML content
    - AudioResultCard: Card for Audio content
    - MarkdownResultCard: Card for Markdown content
    - ImageResultCard: Card for Image content
    - PDFResultCard: Card for PDF content
    - EPUBResultCard: Card for EPUB content
    - YouTubeResultCard: Card for YouTube content
*/

export type CardProps = {
  result: ContentMatch;
  file: File;
  parent?: File;
};

const ResultBase: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="w-full h-36 bg-base-100 p-2 shadow-lg flex flex-col gap-1 justify-between">
      {children}
    </div>
  );
};

export const LoadingResult: React.FC = () => {
  return (
    <div className="h-36 bg-base-100 p-2 w-full">
      <div className="h-36 bg-base-200 w-full animate-pulse"></div>
    </div>
  );
};

const TextContentSnippetContainer: React.FC<{
  content: ContentMatch;
}> = ({ content }) => {
  return (
    <div className="w-full overflow-y-scroll h-22 relative">
      {content.beforeSnippets.map((snippet, i) => (
        <span className="opacity-75 text-xs" key={i}>
          {snippet}{' '}
        </span>
      ))}
      <b // we want to make sure the main snippet is in view so scroll to it but only of its subcontainer is in view
        ref={(el) => {
          if (el) {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }
        }}
        className="text-sm"
      >
        {content.snippet}
      </b>
      {content.afterSnippets.map((snippet, i) => (
        <span className="opacity-75 text-xs" key={i}>
          {' '}
          {snippet}
        </span>
      ))}
    </div>
  );
};

const InfoContainer: React.FC<{
  file: File;
  parent?: File;
}> = ({ file, parent }) => {
  return (
    <div className="flex flex-row justify-between items-center gap-4 w-full">
      {/* File Link */}
      <div className="flex flex-row items-center gap-2 max-w-3/4 truncate">
        <FileIcon file={file} />
        <a
          href={frontend + '/files?id=' + file.id}
          target="_blank"
          rel="noopener noreferrer"
          className="link normal-case visited:text-primary text-sm"
        >
          {file.name}
        </a>
      </div>
      {/* Parent Link */}
      <div className="flex flex-row items-center gap-2 max-w-1/4 truncate">
        {parent ? (
          <>
            <FileIcon file={parent} />
            <a
              href={frontend + '/files?id=' + parent.id}
              target="_blank"
              rel="noopener noreferrer"
              className="link normal-case visited:text-primary text-sm"
            >
              {parent.name}
            </a>
          </>
        ) : (
          <>
            <FolderIcon className="h-4 w-4" />
            <a
              href={frontend + '/files?id=home'}
              target="_blank"
              rel="noopener noreferrer"
              className="link normal-case visited:text-primary truncate text-sm"
            >
              Home
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export const FileResult: React.FC<CardProps> = ({ result, file, parent }) => {
  return (
    <ResultBase>
      <TextContentSnippetContainer content={result} />
      <InfoContainer file={file} parent={parent} />
    </ResultBase>
  );
};

{
  /* <a
        href={frontend + '/files?id=' + file.id}
        target="_blank"
        rel="noopener noreferrer"
        className="link normal-case visited:text-primary flex-shrink min-w-1/2 truncate text-sm"
      >
        <span className="flex w-full justify-between items-center">
          <FileIcon file={file} />
          {file.name}
        </span>
      </a>
      {parent ? (
        <a
          href={frontend + '/files?id=' + parent.id}
          target="_blank"
          rel="noopener noreferrer"
          className="link normal-case visited:text-primary flex-grow truncate text-sm"
        >
          <FileIcon file={parent} />
          {parent.name}
        </a>
      ) : (
        <a
          href={frontend + '/files?id=home'}
          target="_blank"
          rel="noopener noreferrer"
          className="link normal-case visited:text-primary flex-grow truncate text-sm"
        >
          <FolderIcon className="h-4 w-4" />
          Home
        </a>
      )}
    </div> */
}
