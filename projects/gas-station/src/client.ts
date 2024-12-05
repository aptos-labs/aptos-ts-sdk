import axios from 'axios';
import { Account, Aptos, AptosConfig, Network, } from '@aptos-labs/ts-sdk';

const main = async () => {
    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);

    // Create sender and recipient accounts
    const alice = Account.generate();
    const bob = Account.generate();

    console.log("Alice's address:", alice.accountAddress.toStringLong());
    console.log("Bob's address:", bob.accountAddress.toStringLong());

    // Fund Alice's account
    await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });

    const transaction = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        withFeePayer: true,
        data: {
            function: "0x1::aptos_account::transfer",
            functionArguments: [bob.accountAddress, 100],
        },
    });

    // Sign the transaction as Alice
    const senderAuthenticator = aptos.transaction.sign({ signer: alice, transaction });

    // Send the transaction to the sponsor server
    const response = await axios.post(
        "http://localhost:3000/signAndSubmit",
        {
            transactionBytes: Array.from(transaction.bcsToBytes()),
            senderAuthenticator: Array.from(senderAuthenticator.bcsToBytes()),
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );


    const { transactionHash } = response.data;

    console.log("Transaction submitted. Hash:", transactionHash);
    const executedTx = await aptos.waitForTransaction({ transactionHash: transactionHash });
    console.log("Executed transaction:", executedTx);
};

main();
