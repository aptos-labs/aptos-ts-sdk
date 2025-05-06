import path from "path";
import fs from "fs";
import { genBatchRangeZKP, generateRangeZKP, verifyBatchRangeZKP, verifyRangeZKP } from "./wasmRangeProof";
import { RangeProofExecutor } from "../../src/rangeProof";

export const longTestTimeout = 120 * 1000;

const rootDir = path.resolve(__dirname, "../../../");

export const addNewContentLineToFile = (filename: string, data: string) => {
  const filePath = path.resolve(rootDir, filename);

  const content = `\n#TESTNET_DK=${data}\n`;

  fs.appendFileSync(filePath, content);
};

RangeProofExecutor.setGenBatchRangeZKP(genBatchRangeZKP);
RangeProofExecutor.setVerifyBatchRangeZKP(verifyBatchRangeZKP);
RangeProofExecutor.setGenerateRangeZKP(generateRangeZKP);
RangeProofExecutor.setVerifyRangeZKP(verifyRangeZKP);
