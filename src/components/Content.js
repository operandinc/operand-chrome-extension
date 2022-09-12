import React from "react";

const Content = ({ query }) => {
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [token, setToken] = React.useState("");
  React.useEffect(() => {
    // Get the token
    chrome.storage.sync.get("integrationToken", (result) => {
      if (result.integrationToken != undefined) {
        setToken(result.integrationToken);
      }
    });
  }, []);
  React.useEffect(() => {
    const fetchResults = async () => {
      const response = await fetch("https://brain.operand.ai/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          query,
        }),
      });
      const data = await response.json();
      setResults(data.results);
      setLoading(false);
    };
    if (token) {
      fetchResults();
    }
  }, [query, token]);
  return (
    <div className={`${!token ? "hidden" : ""}`}>
      {/* Operand Section */}
      <div className="w-full">
        <div className="pb-2 text-base text-black dark:text-white">
          Operand Results:
        </div>
        {loading ? (
          <div className="w-full">
            <p>Loading Personal Search Results ...</p>
          </div>
        ) : (
          <>
            {results && results.length > 0 ? (
              <div className="w-full space-y-4">
                {results.map((result) => (
                  <div className="w-full">
                    <div className="text-sm text-gray-700 dark:text-gray-400 truncate">
                      {result.url}
                    </div>
                    <a
                      href={result.url}
                      target="_blank"
                      className="text-blue-500 hover:underline text-lg"
                    >
                      {result.title}
                    </a>
                    <div className="py-1">
                      <div className="line-clamp-2 text-sm overflow:hidden">
                        {result.snippet}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full">
                <p>No results found.</p>
              </div>
            )}
          </>
        )}
        <div className="bg-gray-300 h-0.5 my-3 rounded w-full"></div>
      </div>
    </div>
  );
};

export default Content;
