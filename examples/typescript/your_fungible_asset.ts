import {
  Account,
  Cedra,
  CedraConfig,
  Network,
} from "@cedra-labs/ts-sdk";
 
async function main() {
  // Initialize the Cedra client
  const config = new CedraConfig({ network: Network.DEVNET });
  const cedra = new Cedra(config);
  
  console.log("Connected to Cedra devnet");

  // Generate two accounts
const alice = Account.generate();
const bob = Account.generate();
 
console.log("=== Addresses ===");
console.log(`Alice's address: ${alice.accountAddress}`);
console.log(`Bob's address: ${bob.accountAddress}`);
  
  // More code will go here
  //
  // / Fund the accounts with test APT from the devnet faucet
console.log("\n=== Funding accounts ===");

await cedra.fundAccount({
  accountAddress: alice.accountAddress,
  amount: 100_000_000, // 1 APT = 100,000,000 octas
});
console.log("Accounts funded successfully");
 
// Check initial balances
const aliceBalance = await cedra.getAccountAPTAmount({
  accountAddress: alice.accountAddress,
});
const bobBalance = await cedra.getAccountAPTAmount({
  accountAddress: bob.accountAddress,
});
 
console.log("\n=== Initial Balances ===");
console.log(`Alice: ${aliceBalance} octas`);
console.log(`Bob: ${bobBalance} octas`);
}
 
main().catch(console.error)
