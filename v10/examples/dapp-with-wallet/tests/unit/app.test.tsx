import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { App } from "../../src/App.js";

// Mock wallet adapter
vi.mock("@aptos-labs/wallet-adapter-react", () => ({
  useWallet: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    account: null,
    wallets: [{ name: "Test Wallet" }],
    signAndSubmitTransaction: vi.fn(),
  })),
}));

describe("App", () => {
  it("renders the title", () => {
    render(<App />);
    expect(screen.getByText("Aptos v10 dApp")).toBeInTheDocument();
  });

  it("shows connect prompt when disconnected", () => {
    render(<App />);
    expect(
      screen.getByText("Connect a wallet to get started"),
    ).toBeInTheDocument();
  });

  it("shows wallet buttons", () => {
    render(<App />);
    expect(screen.getByText("Test Wallet")).toBeInTheDocument();
  });

  it("does not show transfer form when disconnected", () => {
    render(<App />);
    expect(screen.queryByText("Transfer APT")).not.toBeInTheDocument();
  });
});

describe("App (connected)", () => {
  it("shows transfer form when connected", async () => {
    const { useWallet } = await import("@aptos-labs/wallet-adapter-react");
    vi.mocked(useWallet).mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      account: { address: "0x1234", publicKey: "0x" },
      wallets: [],
      signAndSubmitTransaction: vi.fn(),
    } as any);

    render(<App />);
    expect(screen.getByText("Transfer APT")).toBeInTheDocument();
    expect(screen.getByText(/Connected:/)).toBeInTheDocument();
  });
});
