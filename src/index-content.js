import React from "react";
import { render } from "react-dom";
import "./content.css";
import Content from "./components/Content.js";
// This is a chrome extension content script that injects the content component.
// First we check if the user has enabled injections.
chrome.storage.sync.get("settings", (result) => {
  if (result.settings != undefined && result.settings.searchInjection) {
    // Create a div element to render the content component.
    const content_entry_point = document.createElement("div");
    let reactJS_script = document.createElement("script");
    content_entry_point.id = "operand-content";
    content_entry_point.appendChild(reactJS_script);

    // Insert the content entry point into the DOM as the first child of topstuff.
    document.getElementById("topstuff").appendChild(content_entry_point);

    // Get the q parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    render(<Content query={q} />, document.querySelector("#operand-content"));
  }
});
