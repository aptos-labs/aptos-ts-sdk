import { execSync } from "child_process";
import { AccountAddress, Aptos, AptosApiType, Ed25519PrivateKey } from "../../../src";
import { LOCAL_ANS_ACCOUNT_PK, LOCAL_ANS_ACCOUNT_ADDRESS } from "../../../src/internal/ans";

// Function to execute a command and return the output as a string
function execCmdString(command: string): string {
  console.log(`Executing '${command}'`);
  return execSync(command, { encoding: "utf8" });
}

// Function to execute a command with inheriting stdio
function execCmdBuffer(command: string): Buffer {
  console.log(`Executing '${command}'`);
  return execSync(command, { stdio: "inherit" });
}

// Function to publish ANS contract
export async function publishAnsContract(aptos: Aptos): Promise<{ address: AccountAddress; privateKey: Ed25519PrivateKey }> {
  const ret = {
    address: AccountAddress.fromString(LOCAL_ANS_ACCOUNT_ADDRESS),
    privateKey: new Ed25519PrivateKey(LOCAL_ANS_ACCOUNT_PK),
  };

  try {
    // Check if ANS contract is already published
    await aptos.account.getAccountModule({
      accountAddress: LOCAL_ANS_ACCOUNT_ADDRESS,
      moduleName: "domains",
    });
    console.log("ANS contract already published");
    return ret;
  } catch {
    // If not published, proceed with publishing
  }

  try {
    // Create a temporary directory to clone the ANS repo
    console.log("---creating temporary directory for ANS code---");
    const tempDir = execSync("mktemp -d").toString("utf8").trim();

    // Clone the ANS repo into the temporary directory
    console.log(`---cloning ANS repository to ${tempDir}---`);
    execSync(`git clone https://github.com/aptos-labs/aptos-names-contracts.git ${tempDir}`);

    // Derive the router signer address
    const ROUTER_SIGNER = `0x${JSON.parse(
      execCmdString(`aptos account derive-resource-account-address --address ${LOCAL_ANS_ACCOUNT_ADDRESS} --seed "ANS ROUTER" --seed-encoding utf8`),
    ).Result}`;
    console.log(`Resource account ${ROUTER_SIGNER}`);

    // Fund ANS account
    console.log("---funding account---");
    const fundTxn = await aptos.fundAccount({
      accountAddress: LOCAL_ANS_ACCOUNT_ADDRESS.toString(),
      amount: 100_000_000_000,
    });
    await aptos.waitForTransaction({ transactionHash: fundTxn.hash });
    console.log(`Test account funded ${LOCAL_ANS_ACCOUNT_ADDRESS}`);

    // Publish the ANS modules under the ANS account
    console.log("---publishing ans modules---");
    const contracts = ["core", "core_v2", "router"];
    for (const contract of contracts) {
      execCmdBuffer(
        `aptos move publish --package-dir ${tempDir}/${contract} --assume-yes --private-key=${LOCAL_ANS_ACCOUNT_PK} --named-addresses aptos_names=${LOCAL_ANS_ACCOUNT_ADDRESS},router=${LOCAL_ANS_ACCOUNT_ADDRESS},aptos_names_v2_1=${LOCAL_ANS_ACCOUNT_ADDRESS},aptos_names_admin=${LOCAL_ANS_ACCOUNT_ADDRESS},aptos_names_funds=${LOCAL_ANS_ACCOUNT_ADDRESS},router_signer=${ROUTER_SIGNER} --url=${aptos.config.getRequestUrl(AptosApiType.FULLNODE)}`,
      );
    }
    console.log("---module published---");

    return ret;
  } catch (error: any) {
    throw new Error(`Failed to publish ANS contract ${JSON.stringify(error)}`);
  }
}
