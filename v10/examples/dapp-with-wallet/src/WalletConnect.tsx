import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function WalletConnect() {
  const { connect, disconnect, account, connected, wallets } = useWallet();

  if (connected && account) {
    return (
      <div>
        <p>
          Connected: <code>{account.address}</code>
        </p>
        <button type="button" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Connect a wallet to get started</p>
      {wallets?.map((wallet) => (
        <button
          key={wallet.name}
          type="button"
          onClick={() => connect(wallet.name)}
          style={{ marginRight: 8 }}
        >
          {wallet.name}
        </button>
      ))}
    </div>
  );
}
