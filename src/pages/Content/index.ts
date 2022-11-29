import * as React from 'react';
import { render } from 'react-dom';
import { getSearchInjectionEnabled } from '../../storage';
import { Google } from './modules/google';
// This is a chrome extension content script that injects the content component.
// First we check if the user has enabled injections.
getSearchInjectionEnabled().then((enabled) => {
  if (enabled) {
    // Create a div element to render the content component.
    const content_entry_point = document.createElement('div');
    let reactJS_script = document.createElement('script');
    content_entry_point.id = 'operand-content';
    content_entry_point.appendChild(reactJS_script);
    // Insert the content entry point into the DOM as the first child of topstuff.
    document.getElementById('topstuff')?.appendChild(content_entry_point);
    // Get the q parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    // Wait for 1 second to make sure the DOM is loaded
    if (!q) {
      return;
    }
    console.log('Rendering content component');
    // Render the content component
    render(React.createElement(Google, { query: q }), content_entry_point);
  }
});
