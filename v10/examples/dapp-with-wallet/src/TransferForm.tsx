import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk/compat";

const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));

export function TransferForm() {
  const { signAndSubmitTransaction } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("1000");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [recipient, Number(amount)],
        },
      });
      const committed = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      setResult(
        `Success! Version: ${committed.version}, Hash: ${committed.hash}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <h2>Transfer APT</h2>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="recipient">
          Recipient address:
          <br />
          <input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="amount">
          Amount (octas):
          <br />
          <input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            style={{ width: "100%", padding: 8 }}
          />
        </label>
      </div>
      <button type="submit" disabled={loading || !recipient}>
        {loading ? "Submitting..." : "Send"}
      </button>
      {result && <p style={{ color: "green" }}>{result}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
