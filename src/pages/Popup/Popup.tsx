import { AdjustmentsVerticalIcon } from '@heroicons/react/24/solid';
import React from 'react';
import Chat from '../../chat';
import { getApiKey, getParentId } from '../../storage';
import './Popup.css';

const Popup = () => {
  const [apiKey, setApiKey] = React.useState<string>('');
  const [parentId, setParentId] = React.useState<string>('');

  React.useEffect(() => {
    async function onLoad() {
      const apiKey = await getApiKey();
      if (!apiKey || apiKey === '') {
        return null;
      }
      setApiKey(apiKey);
      const parentId = await getParentId();
      setParentId(parentId);
    }
    onLoad();
  }, []);
  return (
    <div className="flex flex-col w-96 h-[600px] p-2">
      {apiKey ? (
        <div className="h-full space-y-6">
          <div className="flex justify-end">
            <button
              className="btn btn-sm btn-outline btn-primary"
              onClick={() => {
                chrome.runtime.openOptionsPage();
              }}
            >
              <AdjustmentsVerticalIcon className="w-6 h-6" />
            </button>
          </div>
          <Chat
            apiKey={apiKey}
            parentId={parentId}
            className="h-[85vh] flex flex-col-reverse justify-start overflow-auto"
          />
        </div>
      ) : (
        <div className="flex-grow flex flex-col text-center prose pt-4 items-center space-y-4">
          <h4>
            You need to set your API key in the extension settings before you
            can use the extension.
          </h4>
          <div
            className="btn btn-primary"
            onClick={() => {
              chrome.runtime.openOptionsPage();
            }}
          >
            set api key
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;
