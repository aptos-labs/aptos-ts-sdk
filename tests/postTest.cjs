module.exports = async function () {
  // Check if the current local node process is
  // from within the sdk node environment
  if (globalThis.__LOCAL_NODE__.process) {
    const cedraNode = globalThis.__LOCAL_NODE__;
    // Local node runs multiple procceses, to avoid asynchronous operations
    // that weren't stopped in our tests, we kill all the descendent processes
    // of the node process, including the node process itself
    cedraNode.stop();
  }
};
