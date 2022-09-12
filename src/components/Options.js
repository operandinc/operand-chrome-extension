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

function saveInject(inject) {
  chrome.storage.sync.set({ inject });
}

function Options() {
  const [integrationToken, setIntegrationToken] = React.useState("");
  const [savedToken, setSavedToken] = React.useState(false);
  const [mode, setMode] = React.useState("manual");
  const [modeSwitch, setModeSwitch] = React.useState(false);
  const [inject, setInject] = React.useState(true);
  const [injectSwitch, setInjectSwitch] = React.useState(true);
  React.useEffect(() => {
    loadIntegrationToken();
    // Get the mode and set the switch
    chrome.storage.sync.get("mode", (result) => {
      if (result.mode != undefined) {
        setMode(result.mode);
        if (result.mode == "auto") {
          setModeSwitch(true);
        }
      }
    });
    // Get the inject and set the switch
    chrome.storage.sync.get("inject", (result) => {
      if (result.inject != undefined) {
        setInject(result.inject);
        if (result.inject == "false") {
          setInjectSwitch(false);
        }
      }
    });
  }, []);

  // When enabled changes, save the mode
  React.useEffect(() => {
    if (modeSwitch) {
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
  }, [modeSwitch]);

  // When inject changes, save the inject
  React.useEffect(() => {
    if (injectSwitch) {
      saveInject("true");
    } else {
      saveInject("false");
    }
    // Get the inject again
    chrome.storage.sync.get("inject", (result) => {
      if (result.inject != undefined) {
        setInject(result.inject);
      }
    });
  }, [injectSwitch]);

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
                checked={modeSwitch}
                onChange={setModeSwitch}
                className={classNames(
                  modeSwitch ? "bg-green-600" : "bg-gray-200",
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                )}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    modeSwitch ? "translate-x-5" : "translate-x-0",
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
          <div className="pt-5">
            <div className="block pb-3 text-sm font-medium text-gray-700">
              Inject
            </div>
            <Switch.Group as="div" className="flex items-center">
              <Switch
                checked={injectSwitch}
                onChange={setInjectSwitch}
                className={classNames(
                  injectSwitch ? "bg-green-600" : "bg-gray-200",
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                )}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    injectSwitch ? "translate-x-5" : "translate-x-0",
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  )}
                />
              </Switch>
              <Switch.Label as="span" className="ml-3" id="mode">
                <span className="text-sm font-medium text-gray-900">
                  {inject}
                </span>
              </Switch.Label>
            </Switch.Group>
            <p className="mt-2 text-sm text-gray-500">
              Enabled: We'll inject Operand search results into Google.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Disabled: You can only search from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;
