import { AptosConfig } from "../api/aptosConfig";
import { Account, Signature } from "../core";
import { EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes, generateProofChallenge } from "../transactions";
import { ProofChallenge } from "../transactions/instances/proofChallenge";
import { MoveFunctionId } from "../types";

export async function createProofChallenge(args: {
  config: AptosConfig;
  struct: MoveFunctionId;
  data: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>;
}): Promise<ProofChallenge> {
  const challenge = generateProofChallenge({ ...args });
  return challenge;
}

export function signProofChallenge(args: { challenge: ProofChallenge; signer: Account }): Signature {
  const { challenge, signer } = args;
  const challengeHex = challenge.bcsToBytes();
  const signature = signer.sign(challengeHex);
  return signature;
}
