import {
  Ed25519Account,
  AbstractedAccount,
  FungibleAssetPermission,
  AccountAddress,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";

// Initialize the Aptos client
const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

async function demoPermissions() {
  /**
   * This would be the account that we want to request permissions from.
   * This would come back from the wallet.
   */
  const primaryAccount = Ed25519Account.generate();

  /**
   * This is not a true account on chain, just a key-pair that we will use to
   * request permissions. You can save the private key of the delegation account
   * and use it later.
   */
  const delegationAccount = Ed25519Account.generate();

  /**
   * We take the delegation account and create an abstract account from it. We
   * then use this abstract account to execute transactions on behalf of the
   * primary account.
   */
  const abstractAccount = AbstractedAccount.fromPermissionedSigner({ signer: delegationAccount });

  /**
   * This is the transaction that we will use to request permissions. Note that
   * we must specify the primary account address and the delegation public key.
   * We also must sign the request transactions with the primary account.
   */
  const txn1 = await aptos.permissions.requestPermissions({
    primaryAccountAddress: primaryAccount.accountAddress,
    delegationPublicKey: delegationAccount.publicKey,
    permissions: [
      FungibleAssetPermission.from({
        asset: AccountAddress.A, // Replace with the actual asset address
        amount: 10, // Amount of the asset
      }),
    ],
  });
  const txn1Result = await aptos.signAndSubmitTransaction({
    signer: primaryAccount,
    transaction: txn1,
  });
  await aptos.waitForTransaction({ transactionHash: txn1Result.hash });

  /**
   * This is the transaction that we will use to execute the function on behalf
   * of the primary account. Here we are transferring 5 units of the asset to
   * another account. Note how the sender is the primary account address and the
   * signer is the abstract account.
   */
  const txn2 = await aptos.signAndSubmitTransaction({
    signer: abstractAccount,
    transaction: await aptos.transaction.build.simple({
      sender: primaryAccount.accountAddress,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, "receiver_account_address", 5], // Replace with actual receiver address
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    }),
  });
  const txn2Result = await aptos.waitForTransaction({ transactionHash: txn2.hash, options: { checkSuccess: true } });
  console.log("Transaction success:", txn2Result.success);

  /**
   * This is how we can fetch existing permissions for a delegated account.
   * Note, a primary account can have any number of delegated accounts.
   */
  const permissions = await aptos.getPermissions({
    primaryAccountAddress: primaryAccount.accountAddress,
    delegationPublicKey: delegationAccount.publicKey,
    filter: FungibleAssetPermission,
  });

  console.log("Existing permissions:", permissions);

  /**
   * This is how we can revoke permissions.
   */
  const txn3 = await aptos.signAndSubmitTransaction({
    signer: primaryAccount,
    transaction: await aptos.permissions.revokePermission({
      primaryAccountAddress: primaryAccount.accountAddress,
      delegationPublicKey: delegationAccount.publicKey,
      permissions: [FungibleAssetPermission.revoke({ asset: AccountAddress.A })],
    }),
  });
  const txn3Result = await aptos.waitForTransaction({ transactionHash: txn3.hash });
  console.log("Transaction success:", txn3Result.success);
}

// Execute the demo
demoPermissions().catch(console.error);
