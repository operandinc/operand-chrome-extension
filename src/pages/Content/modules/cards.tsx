import {
  DocumentIcon,
  LinkIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/solid';
import { ContentSnippet, Index, Object$ } from '@operandinc/sdk';
import * as React from 'react';
import { Discord, IconProps, Linear, Notion, Slack } from './icons';
import '../content.styles.css';

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
  result: ContentSnippet;
  index: Index;
  object: Object$;
};

const CardBase: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="w-full h-36 bg-base-100 p-4 shadow-lg flex flex-col gap-1 justify-between">
      {children}
    </div>
  );
};

export const LoadingCard: React.FC = () => {
  return (
    <div className="h-36 bg-base-100 p-2 shadow-lg w-full">
      <div className="h-36 bg-base-100 w-full animate-pulse"></div>
    </div>
  );
};

const TextContentSnippetContainer: React.FC<{
  content: string;
}> = ({ content }) => {
  return <div className="line-clamp-3 text-lg h-22">{content}</div>;
};

const InfoContainer: React.FC<{
  index: Index;
  object: Object$;
  Icon: React.FC<IconProps>;
  altTitle: string;
  useOriginalUrl: boolean;
}> = ({ index, object, Icon, altTitle, useOriginalUrl }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            onClick={() => {
              if (useOriginalUrl) {
                // Do not use the Operand URL
                window.open(
                  object.preview?.url ? object.preview?.url : '',
                  '_blank'
                );
              } else {
                // Use the Operand URL
                window.open(
                  `https://operand.ai/indexes/${index.publicId}/${object.id}`,
                  '_blank'
                );
              }
            }}
            className="btn btn-sm btn-outline normal-case gap-4 truncate"
          >
            {React.createElement(Icon, {
              className: 'w-4 h-4',
            })}
            {object.preview?.title ? object.preview?.title : altTitle}
          </div>
        </div>
        <div className="btn btn-sm btn-outline normal-case gap-4 truncate">
          <RectangleStackIcon className="w-4 h-4" />
          {index.name}
        </div>
      </div>
      <div>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={object.preview?.url ? object.preview.url : ''}
          className="text-sm text-primary opacity-60 hover:cursor-pointer hover:underline truncate"
        >
          {object.preview?.url ? object.preview.url : ''}
        </a>
      </div>
    </div>
  );
};

export const TextResultCard: React.FC<CardProps> = ({
  result,
  object,
  index,
}) => {
  if (object.preview?.url?.includes('discord.com')) {
    return (
      <CardBase>
        <TextContentSnippetContainer content={result.content} />
        <InfoContainer
          index={index}
          object={object}
          Icon={Discord}
          altTitle="View On Discord"
          useOriginalUrl={true}
        />
      </CardBase>
    );
  } else if (object.preview?.url?.includes('slack.com')) {
    return (
      <CardBase>
        <TextContentSnippetContainer content={result.content} />
        <InfoContainer
          index={index}
          object={object}
          Icon={Slack}
          altTitle="View On Slack"
          useOriginalUrl={true}
        />
      </CardBase>
    );
  } else if (object.preview?.url?.includes('linear.app')) {
    return (
      <CardBase>
        <TextContentSnippetContainer content={result.content} />
        <InfoContainer
          index={index}
          object={object}
          Icon={Linear}
          altTitle="View On Linear"
          useOriginalUrl={true}
        />
      </CardBase>
    );
  } else {
    return (
      <CardBase>
        <TextContentSnippetContainer content={result.content} />
        <InfoContainer
          index={index}
          object={object}
          Icon={DocumentIcon}
          altTitle="View Document"
          useOriginalUrl={false}
        />
      </CardBase>
    );
  }
};

// HTML Cards include general web contents and Notion.
export const HtmlResultCard: React.FC<CardProps> = ({
  result,
  index,
  object,
}) => {
  if (object.preview?.url?.includes('notion.so')) {
    return (
      <CardBase>
        <TextContentSnippetContainer content={result.content} />
        <InfoContainer
          index={index}
          object={object}
          Icon={Notion}
          altTitle="View On Notion"
          useOriginalUrl={true}
        />
      </CardBase>
    );
  } else {
    return (
      <CardBase>
        <TextContentSnippetContainer content={result.content} />
        <InfoContainer
          index={index}
          object={object}
          Icon={LinkIcon}
          altTitle="View Webpage"
          useOriginalUrl={false}
        />
      </CardBase>
    );
  }
};

// Displays code snippets
export const CodeResultCard: React.FC<CardProps> = ({
  result,
  index,
  object,
}) => {
  return (
    <CardBase>
      {/* TODO: Split on newlines and render nicely */}
      {/* Render the code */}
      <div className="prose">
        <pre>
          <code className="break-words">{result.content}</code>
        </pre>
      </div>
    </CardBase>
  );
};
