import * as React from 'react';
import { render } from 'react-dom';
import { getDefaultResults, getSearchInjectionEnabled } from '../../storage';
import { Google } from './modules/google';
// This is a chrome extension content script that injects the content component.
// First we check if the user has enabled injections.

async function main() {
  const enabled = await getSearchInjectionEnabled();
  if (!enabled) {
    return;
  }
  const content_entry_point = document.createElement('div');
  let reactJS_script = document.createElement('script');
  content_entry_point.id = 'operand-content';
  content_entry_point.appendChild(reactJS_script);
  // Insert the content entry point into the DOM as the last child of topstuff.
  document.getElementById('topstuff')?.appendChild(content_entry_point);
  // Get the q parameter from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    // Find root element and set data-theme attribute
    document.documentElement.setAttribute('data-theme', 'black');
  } else {
    document.documentElement.setAttribute('data-theme', 'lofi');
  }
  if (!q) {
    return;
  }
  const defaultResults = await getDefaultResults();
  // Render the content component
  render(
    React.createElement(Google, { query: q, defaultResults }),
    content_entry_point
  );
}

main();
