import * as React from 'react';
import { render } from 'react-dom';
import Chat from '../../chat';
import {
  getAnswersEnabled,
  getDefaultResults,
  getSearchInjectionEnabled,
  getSettings,
} from '../../storage';
import { Google } from './modules/google';
// This is a chrome extension content script that injects the content component.
// First we check if the user has enabled injections.

// Search goes into the topstuff div
async function search() {
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

// Chat goes into the rhs div or if that doesn't exist we make a new div
async function chat() {
  const settings = await getSettings();
  if (!settings || !settings.answersEnabled) {
    return;
  }
  const content_entry_point = document.createElement('div');
  let reactJS_script = document.createElement('script');
  content_entry_point.id = 'operand-chat';
  content_entry_point.appendChild(reactJS_script);
  // Attempt to find the rhs div
  const rhs = document.getElementById('rhs');
  if (rhs) {
    // Insert the content entry point into the DOM as the first child of rhs.
    rhs.insertBefore(content_entry_point, rhs.firstChild);
  }
  // If the rhs div doesn't exist, we make a new div
  else {
    const newDiv = document.createElement('div');
    newDiv.id = 'rhs';
    newDiv.appendChild(content_entry_point);
    // Insert the content entry point into the DOM as the last child of rcnt.
    document.getElementById('rcnt')?.appendChild(newDiv);
  }
}

search();
chat();
