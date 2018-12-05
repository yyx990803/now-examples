const { default: fetch } = require("node-fetch");

const getQueryParams = require("../../utils/getQueryParams");
const render = require("./render");

// If this is 0, the lambda is cold. 😉
let invoked = 0;

module.exports = async (req, res) => {
  /**
   * Reset a mock on each invocation because we mutate it in case of a query param
   * and state is persisted while the function is warm.
   */
  let mock = require("../../utils/mock");

  // Calculate boot costs.
  console.time("Import vue, invoked (again) " + invoked);
  const Vue = require("vue/dist/vue.runtime.min");
  const { createRenderer } = require("vue-server-renderer/build");
  console.timeEnd("Import vue, invoked (again) " + invoked);

  // Fetch if we have the query param.
  const queryParams = getQueryParams(req);

  if (queryParams.fetch) {
    const rawMock = await fetch("https://reddit.com/r/" + queryParams.fetch + ".json");
    mock = await rawMock.json();
  }

  // Get the render method.
  const { renderToString } = createRenderer();

  // Just put it.
  res.writeHead(200, { "content-type": "text/html" });
  res.end(
    await renderToString(
      new Vue({
        data: () => Object.assign({
          active: !queryParams.fetch
        }, mock),
        render,
      }),
    ),
  ),
    // This has been invoked.
    invoked++;
};
