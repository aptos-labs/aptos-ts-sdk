import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletConnect } from "./WalletConnect.js";
import { TransferForm } from "./TransferForm.js";

export function App() {
  const { connected } = useWallet();
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Aptos v10 dApp</h1>
      <p>Uses the compat layer with wallet adapter</p>
      <WalletConnect />
      {connected && <TransferForm />}
    </div>
  );
}
