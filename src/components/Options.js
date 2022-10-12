import React from "react";

function saveIntegrationToken(integrationToken) {
  chrome.storage.sync.set({ integrationToken });
}

function Options() {
  const [integrationToken, setIntegrationToken] = React.useState("");
  const [savedToken, setSavedToken] = React.useState(false);
  const [syncedSettings, setSyncedSettings] = React.useState(false);
  function loadIntegrationToken() {
    chrome.storage.sync.get("integrationToken", function (result) {
      if (result.integrationToken != undefined) {
        document.getElementById("integrationToken").placeholder =
          result.integrationToken;
        setIntegrationToken(result.integrationToken);
      }
    });
  }
  React.useEffect(() => {
    loadIntegrationToken();
  }, []);
  async function syncSettings() {
    setSyncedSettings(false);
    const response = await fetch(
      "https://operand.ai/api/external/clientSettings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: integrationToken,
        },
        body: JSON.stringify({}),
      }
    );
    // Check for 200
    if (response.status != 200) {
      console.log("Error syncing settings");
      return;
    }
    const data = await response.json();
    // Save the settings
    chrome.storage.sync.set({ settings: data });
    setSyncedSettings(true);
  }
  return (
    <div className="max-w-7xl pt-12 mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl p-5 mx-auto">
        <h3 className="text-xl leading-6 font-semibold text-gray-900">
          Token and Settings.
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
                  href="https://operand.ai/personal/settings"
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
          {savedToken != false && (
            <div className="mt-2 text-sm text-gray-500">
              Your token has been saved!
            </div>
          )}
        </div>
        <div className="py-5 space-y-5">
          <h3 className="text-xl leading-6 font-semibold text-gray-900">
            Settings
          </h3>
          <p className="text-sm text-gray-500">
            To change settings in the extension, you need to change your
            settings in your account and then sync them here.
          </p>
          <div>
            <a href="https://operand.ai/personal/settings" target="_blank">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-200">
                Change Settings
              </button>
            </a>
          </div>
          <button
            onClick={() => {
              syncSettings();
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-200"
          >
            Sync Settings
          </button>
          {syncedSettings != false && (
            <div className="mt-2 text-sm text-gray-500">
              Your settings have been synced!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Options;
