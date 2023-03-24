import { File, FileService, operandClient } from '@operandinc/sdk';
import * as React from 'react';
import { endpoint } from '../../environment';

const FileBrowser: React.FC<{
  apiKey: string;
  defaultFolder: File | null;
  callback: (folder: File | null) => Promise<void>;
  buttonText: string;
}> = ({ apiKey, defaultFolder, callback, buttonText }) => {
  const [viewingFolder, setViewingFolder] = React.useState<File | null>(null);
  const [children, setChildren] = React.useState<
    {
      file: File;
      owned: boolean;
    }[]
  >([]);

  const [loading, setLoading] = React.useState<boolean>(false);
  async function getChildren(parentId: string, apiKey: string) {
    setLoading(true);
    const client = operandClient(FileService, apiKey, endpoint);
    if (parentId === '') {
      try {
        const [owned, shared] = await Promise.all([
          client.listFiles({
            filter: {
              parentId: '',
            },
          }),
          client.listFiles({
            filter: {
              shared: true,
            },
          }),
        ]);
        if (owned.files) {
          setChildren(
            owned.files
              .filter((f) => !f.sizeBytes)
              .map((f) => {
                return { file: f, owned: true };
              })
          );
        }
        if (shared.files) {
          setChildren((prev) =>
            prev.concat(
              shared.files
                .filter((f) => !f.sizeBytes)
                .map((f) => {
                  return { file: f, owned: false };
                })
            )
          );
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const res = await client.listFiles({
          filter: {
            parentId: parentId,
          },
          returnOptions: {
            includeParents: true,
          },
        });
        if (res.files) {
          setChildren(
            res.files
              .filter((f) => !f.sizeBytes)
              .map((f) => {
                return { file: f, owned: true };
              })
          );
        }
      } catch (e) {
        console.log(e);
      }
    }
    setLoading(false);
  }

  React.useEffect(() => {
    async function onLoad() {
      if (defaultFolder) {
        setViewingFolder(defaultFolder);
        getChildren(defaultFolder.id, apiKey);
      } else {
        getChildren('', apiKey);
      }
    }
    onLoad();
  }, [defaultFolder, apiKey]);

  return (
    <div className="border p-4 my-4">
      <p>
        Currently Viewing:{' '}
        {viewingFolder ? viewingFolder.name : 'Home & Shared Folders'}
      </p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {children.length > 0 ? (
            <ul className="menu">
              <li className="menu-title">
                <span>Subfolders:</span>
              </li>

              {children.map((child) => (
                <li
                  onClick={async () => {
                    // View the folder
                    setViewingFolder(child.file);
                    getChildren(child.file.id, apiKey);
                  }}
                  key={child.file.id}
                >
                  <a>
                    {child.file.name}
                    {child.owned ? (
                      <>
                        {child.file.sharedWith.length > 0 ? (
                          <span className="badge badge-info ml-2">Shared</span>
                        ) : (
                          <span className="badge badge-info ml-2">Private</span>
                        )}
                      </>
                    ) : (
                      <span className="badge badge-info ml-2">
                        {child.file.creator?.emailAddress}'s Folder
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>This folder has no subfolders.</p>
          )}
        </>
      )}

      <div className="flex justify-end gap-4">
        <button
          onClick={() => {
            setViewingFolder(null);
            getChildren('', apiKey);
          }}
          className={`btn btn-sm ${
            viewingFolder ? 'btn-outline' : 'btn-disabled'
          }`}
        >
          Back to Home & Shared
        </button>

        <button
          onClick={async () => {
            await callback(viewingFolder);
          }}
          className={`btn btn-sm ${
            defaultFolder?.id === viewingFolder?.id
              ? 'btn-disabled'
              : 'btn-primary'
          } `}
        >
          Set {viewingFolder ? viewingFolder.name : 'Home & Shared'} as{' '}
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default FileBrowser;
