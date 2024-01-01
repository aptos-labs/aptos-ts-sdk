module.exports = async function () {
  if (globalThis.__LOCAL_NODE_NPM_PACKAGE__) {
    const aptosNode = globalThis.__LOCAL_NODE__;
    // Local node runs multiple procceses, to avoid asynchronous operations
    // that weren't stopped in our tests, we kill all the descendent processes
    // of the node process, including the node process itself
    aptosNode.stop();
  }
};
