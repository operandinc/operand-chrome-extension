import {
  ContentSnippet,
  Index,
  ObjectPreview,
  ObjectType,
} from '@operandinc/sdk';
import * as React from 'react';
import {
  CardProps,
  CodeResultCard,
  HtmlResultCard,
  TextResultCard,
} from './modules/cards';

export const CardMap: Map<ObjectType, React.FC<CardProps>> = new Map([
  [ObjectType.TEXT, TextResultCard],
  [ObjectType.HTML, HtmlResultCard],
  [ObjectType.MARKDOWN, TextResultCard],
  [ObjectType.SOURCE_CODE, CodeResultCard],
]);
