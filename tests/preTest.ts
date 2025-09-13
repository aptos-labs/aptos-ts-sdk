import { LocalNode } from "../src/cli/index.js";

export default async function setup() {
  const localNode = new LocalNode();
  (globalThis as any).__LOCAL_NODE__ = localNode;
  await localNode.run();

  // 注册进程退出时的清理函数
  process.on("exit", () => {
    if ((globalThis as any).__LOCAL_NODE__?.process) {
      const aptosNode = (globalThis as any).__LOCAL_NODE__;
      aptosNode.stop();
    }
  });

  process.on("SIGINT", () => {
    if ((globalThis as any).__LOCAL_NODE__?.process) {
      const aptosNode = (globalThis as any).__LOCAL_NODE__;
      aptosNode.stop();
    }
    process.exit(0);
  });
}
