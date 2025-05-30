import axios from 'axios';
import { Account, Cedra, CedraConfig, Network, } from '@cedra-labs/ts-sdk';

const main = async () => {
    const config = new CedraConfig({ network: Network.DEVNET });
    const cedra = new Cedra(config);

    // Create sender and recipient accounts
    const alice = Account.generate();
    const bob = Account.generate();

    console.log("Alice's address:", alice.accountAddress.toStringLong());
    console.log("Bob's address:", bob.accountAddress.toStringLong());

    // Fund Alice's account
    await cedra.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });

    const transaction = await cedra.transaction.build.simple({
        sender: alice.accountAddress,
        withFeePayer: true,
        data: {
            function: "0x1::cedra_account::transfer",
            functionArguments: [bob.accountAddress, 100],
        },
    });

    // Sign the transaction as Alice
    const senderAuthenticator = cedra.transaction.sign({ signer: alice, transaction });

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
    const executedTx = await cedra.waitForTransaction({ transactionHash: transactionHash });
    console.log("Executed transaction:", executedTx);
};

main();
