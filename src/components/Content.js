import React from "react";

const Result = ({ result, queryId, token }) => {
  return (
    <div className="w-full h-full">
      <div className="text-sm text-gray-700 dark:text-gray-400 truncate h-5">
        {result.url}
      </div>
      <a
        onClick={() => {
          // Send beacon
          if (queryId) {
            fetch(
              "https://brain.operand.ai/services.brain.v1.BrainService/Feedback",
              {
                method: "POST",
                keepalive: true,
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token,
                },
                body: JSON.stringify({
                  queryId,
                  clickedDocumentId: result.publicId,
                }),
              }
            );
          }
          // Open the link
          window.open(result.url, "_blank");
        }}
        target="_blank"
        className="text-blue-400 hover:underline hover:cursor-pointer text-lg truncate h-6"
      >
        {result.title}
      </a>
      <div className="py-1">
        <div className="line-clamp-2 h-16 text-sm overflow:hidden">
          {result.snippet}
        </div>
      </div>
    </div>
  );
};

const Answer = ({ answer, results, queryId, token }) => {
  const [gaveFeedback, setGaveFeedback] = React.useState(false);
  return (
    <div className="w-full h-full">
      {/* Answer */}
      <div className="w-full h-14 py-2">
        <div className="line-clamp-3">{answer}</div>
      </div>
      {/* Feedback */}
      <div className="w-full h-6 text-sm">
        {!gaveFeedback ? (
          <div>
            {" "}
            Was this answer helpful ? {"  "}
            <span
              onClick={async () => {
                // Send feedback
                if (queryId) {
                  await fetch(
                    "https://brain.operand.ai/services.brain.v1.BrainService/Feedback",
                    {
                      method: "POST",
                      keepalive: true,
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: token,
                      },
                      body: JSON.stringify({
                        queryId,
                        helpfulAnswer: true,
                      }),
                    }
                  );
                }
                setGaveFeedback(true);
              }}
              className="text-blue-500 hover:underline hover:cursor-pointer"
            >
              Yes
            </span>{" "}
            |{" "}
            <span
              onClick={async () => {
                // Send feedback
                if (queryId) {
                  await fetch(
                    "https://brain.operand.ai/services.brain.v1.BrainService/Feedback",
                    {
                      method: "POST",
                      keepalive: true,
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: token,
                      },
                      body: JSON.stringify({
                        queryId,
                        helpfulAnswer: false,
                      }),
                    }
                  );
                }
                setGaveFeedback(true);
              }}
              className="text-blue-500 hover:underline hover:cursor-pointer"
            >
              No
            </span>
          </div>
        ) : (
          <div>Thank you for your feedback!</div>
        )}
      </div>
      {/* Sources*/}
      <div className="w-full h-6">
        <div className="text-sm truncate">
          Sources:{" "}
          {results &&
            results.map((result) => (
              <span>
                <a
                  onClick={() => {
                    // Send beacon
                    if (queryId) {
                      fetch(
                        "https://brain.operand.ai/services.brain.v1.BrainService/Feedback",
                        {
                          method: "POST",
                          keepalive: true,
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: token,
                          },
                          body: JSON.stringify({
                            queryId,
                            clickedDocumentId: result.publicId,
                          }),
                        }
                      );
                    }
                    // Open the link
                    window.open(result.url, "_blank");
                  }}
                  target="_blank"
                >
                  {result.title}
                </a>{" "}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

const Content = ({ query }) => {
  const [results, setResults] = React.useState([]);
  const [answer, setAnswer] = React.useState("");
  const [queryId, setQueryId] = React.useState("");
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
      try {
        // Fetch all urls in search results for server-side processing
        const urls = Array.from(
          document.querySelectorAll(`div[id="search"] a[href]`)
        ).map((a) => a.href);

        const response = await fetch(
          "https://brain.operand.ai/services.brain.v1.BrainService/Query",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({
              query,
              urls,
            }),
          }
        );
        const data = await response.json();
        // Make sure we have some results
        if (data) {
          setQueryId(data.queryId);
          // Set the results
          setResults(data.results);
          // Set the answer
          if (data.answer) {
            setAnswer(data.answer);
          }
        }
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    if (token) {
      fetchResults();
    }
  }, [query, token]);

  // Show an answer first if its available.
  return (
    <div className={`${!token ? "hidden" : ""}`}>
      {/* Operand Section */}
      <div className="w-full h-40 pb-3 overflow:hidden">
        <div className="h-6 pb-1 text-base text-black dark:text-white ">
          Operand Result:
        </div>
        {loading ? (
          <div className="flex items-center justify-center w-full h-28">
            <div>Loading Personal Search Results ...</div>
          </div>
        ) : (
          <div className="w-full h-28">
            {/* Have an answer display it */}
            {answer && (
              <Answer
                answer={answer}
                results={results}
                queryId={queryId}
                token={token}
              />
            )}
            {/* No answer but search result display it */}
            {answer == "" && results && results.length > 0 && (
              <Result result={results[0]} queryId={queryId} token={token} />
            )}
            {/* No answer or search results */}
            {answer == "" && (!results || results.length == 0) && (
              <div className="flex items-center justify-center w-full h-28">
                <div>No results found.</div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center w-full h-4 py-2 space-x-4">
          <div className="bg-gray-300 h-0.5 rounded flex-grow"></div>
          <div
            className="text-sm text-gray-700 dark:text-gray-400 hover:underline hover:cursor-pointer"
            onClick={() => {
              // Typeform link
              window.open(
                "https://operandai.typeform.com/to/svjZU4wl",
                "_blank"
              );
            }}
          >
            have some feedback ?
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;
