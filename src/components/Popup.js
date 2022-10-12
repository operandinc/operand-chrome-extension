import React from "react";

async function doIndex(url) {
  let result = await chrome.storage.sync.get("integrationToken");
  const token = result.integrationToken;
  // Search for the query
  try {
    await fetch(`https://operand.ai/api/external/clientIndex`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        url,
      }),
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function Popup() {
  const [validToken, setValidToken] = React.useState(false);
  const [mode, setMode] = React.useState("auto");
  const [indexed, setIndexed] = React.useState(false);
  React.useEffect(() => {
    // Get the token
    chrome.storage.sync.get("integrationToken", (result) => {
      if (result.integrationToken != undefined) {
        setValidToken(true);
      }
    });
    // Get the settings
    chrome.storage.sync.get("settings", (result) => {
      if (result.settings != undefined && !result.settings.automaticIndexing) {
        setMode("manual");
      }
    });
  }, []);

  return (
    <>
      {!validToken ? (
        <div className="h-48 w-48">
          <div className="h-full w-full flex justify-center items-center">
            <p className="text-center">
              Go to the{" "}
              <a
                className="underline hover:cursor-pointer"
                onClick={() => chrome.runtime.openOptionsPage()}
              >
                options
              </a>{" "}
              page to set up your integration token.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-32 w-32 ">
          <div className="flex flex-col h-full w-full">
            <div className="flex flex-col grow p-1 pr-2">
              {mode == "manual" ? (
                <>
                  {!indexed ? (
                    <button
                      className="flex-grow border-black border-2 hover:bg-gray-100 rounded-md p-2 shadow m-2 text-lg font-semibold"
                      onClick={() => {
                        // Gets the current url and indexes it
                        chrome.tabs.query(
                          { active: true, currentWindow: true },
                          (tabs) => {
                            const success = doIndex(tabs[0].url);
                            if (success) {
                              setIndexed(true);
                            }
                          }
                        );
                      }}
                    >
                      Index
                    </button>
                  ) : (
                    <div className="flex h-full items-center justify-center text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-12 h-12"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <p className="text-center">
                    Auto indexing is currently enabled. To disable it go to the{" "}
                    <span
                      onClick={() => {
                        chrome.runtime.openOptionsPage();
                      }}
                      className="underline hover:cursor-pointer"
                    >
                      options page
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="py-2 px-1 bg-black">
              <div className="flex items-center justify-end">
                <a
                  className="hover:cursor-pointer p-1 rounded hover:bg-blue-200"
                  onClick={() => {
                    chrome.runtime.openOptionsPage();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Popup;
