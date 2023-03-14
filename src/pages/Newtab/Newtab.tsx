import React from 'react';
import Chat from '../../chat';
import { getApiKey, getParentId } from '../../storage';
import './Newtab.css';

const Newtab = () => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [apiKey, setApiKey] = React.useState<string>();
  const [parentId, setParentId] = React.useState<string>('');

  React.useEffect(() => {
    async function onLoad() {
      var apiKey = await getApiKey();
      if (!apiKey) {
        return null;
      }
      setApiKey(apiKey);
      const parentId = await getParentId();
      setParentId(parentId);
      setLoading(false);
    }

    onLoad();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20">
      <div className="mx-auto max-w-2xl">
        {loading ? (
          <></>
        ) : apiKey ? (
          <div className="h-full space-y-6">
            <Chat
              apiKey={apiKey}
              parentId={parentId}
              className="h-[85vh] flex flex-col-reverse justify-start overflow-auto"
            />
          </div>
        ) : (
          <div className="flex flex-col w-full h-96 items-center justify-center space-y-10">
            <div className="prose">
              <h2>
                Please add your Chrome extension code to use the extension
              </h2>
            </div>
            <div
              onClick={() => {
                chrome.runtime.openOptionsPage();
              }}
              className="btn btn-primary"
            >
              open options
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Newtab;
