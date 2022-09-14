// Get history going back 30 days.
// function getHistory() {
//   return new Promise((resolve, reject) => {
//     chrome.history.search(
//       {
//         text: "",
//         startTime: new Date().getTime() - 1000 * 60 * 60 * 24 * 30,
//         maxResults: 10000,
//       },
//       (results) => {
//         resolve(results);
//       }
//     );
//   });
// }

// On Install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Installed!");
  // If the token is not set, open the options page
  chrome.storage.sync.get("integrationToken", async (result) => {
    if (!result.integrationToken) {
      chrome.runtime.openOptionsPage();
    }
  });
  // Once the token is set we want to get their history
  // chrome.storage.onChanged.addListener(async (changes, namespace) => {
  //   if (changes.integrationToken) {
  //     // Get the history
  //     const history = await getHistory();
  //     // Send the history to the server
  //     console.log("Sending history to server");
  //     console.log(history);
  //   }
  // });
});

const ignorePrefixes = [
  "chrome://",
  "chrome-extension://",
  "about:",
  "http://localhost",
  "https://www.google.com/search",
  "https://brain.operand.ai/q=",
];

// Injected script that returns the DOM.
// function getDOM() {
//   return document.documentElement.outerHTML;
// }

// On a new tab get the url
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Code to get the DOM for private indexing.
  // chrome.scripting.executeScript(
  //   {
  //     target: { tabId: tabId },
  //     func: getDOM,
  //   },
  //   (injectionResults) => {
  //     for (const frameResult of injectionResults)
  //       console.log("Frame Title: " + frameResult.result);
  //   }
  // );

  if (changeInfo.status == "complete") {
    // Check that the url is not a chrome url
    if (!ignorePrefixes.some((prefix) => tab.url.startsWith(prefix))) {
      // Get the mode
      chrome.storage.sync.get("mode", async (result) => {
        if (result.mode == "auto") {
          console.log("Mode is auto");
          // Get the token
          chrome.storage.sync.get("integrationToken", async (result) => {
            if (result.integrationToken) {
              const token = result.integrationToken;
              const url = tab.url;
              console.log("Token is set");
              console.log("Indexing " + url);
              // Send the url to the API
              try {
                const response = await fetch(
                  `https://brain.operand.ai/api/index`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: token,
                    },
                    body: JSON.stringify({
                      url,
                    }),
                  }
                );
                const data = await response.json();
                console.log(data);
                return true;
              } catch (e) {
                console.log(e);
                return false;
              }
            }
          });
        }
      });
    }
  }
});
