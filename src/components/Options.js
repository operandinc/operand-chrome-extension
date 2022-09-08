import React from "react";
import { Switch } from "@headlessui/react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function saveIntegrationToken(integrationToken) {
  chrome.storage.sync.set({ integrationToken });
}

function loadIntegrationToken() {
  chrome.storage.sync.get("integrationToken", function (result) {
    if (result.integrationToken != undefined) {
      document.getElementById("integrationToken").placeholder =
        result.integrationToken;
    }
  });
}

function saveMode(mode) {
  chrome.storage.sync.set({ mode });
}

function Options() {
  const [integrationToken, setIntegrationToken] = React.useState("");
  const [savedToken, setSavedToken] = React.useState(false);
  const [mode, setMode] = React.useState("manual");
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    loadIntegrationToken();
    // Get the mode and set the switch
    chrome.storage.sync.get("mode", (result) => {
      if (result.mode != undefined) {
        setMode(result.mode);
        if (result.mode == "auto") {
          setEnabled(true);
        }
      }
    });
  }, []);

  // When enabled changes, save the mode

  React.useEffect(() => {
    if (enabled) {
      saveMode("auto");
    } else {
      saveMode("manual");
    }
    // Get the mode again
    chrome.storage.sync.get("mode", (result) => {
      if (result.mode != undefined) {
        setMode(result.mode);
      }
    });
  }, [enabled]);

  return (
    <div className="max-w-7xl pt-12 mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl p-5 mx-auto">
        <h3 className="text-xl leading-6 font-semibold text-gray-900">
          Brain Chrome Extension Options
        </h3>
        <div className="py-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveIntegrationToken(integrationToken);
              setSavedToken(true);
            }}
          >
            <label
              htmlFor="integrationToken"
              className="block text-sm font-medium text-gray-700"
            >
              API Key
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="integrationToken"
                id="integrationToken"
                autoComplete="off"
                value={integrationToken || ""}
                onChange={(e) => setIntegrationToken(e.target.value)}
                className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder={integrationToken}
                aria-describedby="integrationToken-description"
              />
            </div>
            <div className="flex py-2 justify-between">
              <p
                className="mt-2 text-sm text-gray-500"
                id="integrationToken-description"
              >
                To get your key go to your{" "}
                <a
                  className="underline hover:cursor-pointer"
                  href="https://brain.operand.ai/dashboard"
                >
                  dashboard
                </a>
                . Then copy and paste it here. Don't share this with anyone!
              </p>
              <input
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-200"
                value="Save"
                type="submit"
              />
            </div>
          </form>
          {/* If there is a valid token say that its been saved */}
          {savedToken != "" && (
            <div className="mt-2 text-sm text-gray-500">
              Your token has been saved!
            </div>
          )}
          <div>
            <div className="block pb-3 text-sm font-medium text-gray-700">
              Mode
            </div>
            <Switch.Group as="div" className="flex items-center">
              <Switch
                checked={enabled}
                onChange={setEnabled}
                className={classNames(
                  enabled ? "bg-green-600" : "bg-gray-200",
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                )}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    enabled ? "translate-x-5" : "translate-x-0",
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  )}
                />
              </Switch>
              <Switch.Label as="span" className="ml-3" id="mode">
                <span className="text-sm font-medium text-gray-900">
                  {mode}
                </span>
              </Switch.Label>
            </Switch.Group>
            <p className="mt-2 text-sm text-gray-500">
              Manual: Choose when to send a page to Brain.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Auto: We'll index every page you visit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;
