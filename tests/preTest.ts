import { AptosNode } from "../src/cli";

export default async () => {
  const aptosNode = new AptosNode();
  console.log("before start");
  //aptosNode.start();
  console.log("after start");
  await aptosNode.waitUntilProcessIsUp();
  console.log("after waitUntilProcessIsUp");
};
