// On Install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Installed!");
  // If the token is not set, open the options page
  chrome.storage.sync.get("integrationToken", async (result) => {
    if (!result.integrationToken) {
      chrome.runtime.openOptionsPage();
    }
  });
});

const ignorePrefixes = ["chrome://", "chrome-extension://", "about:"];

// On a new tab get the url
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
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
