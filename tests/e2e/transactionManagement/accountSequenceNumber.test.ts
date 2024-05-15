import { longTestTimeout } from "../../unit/helper";
import { Account } from "../../../src/account";
import * as AccountQueries from "../../../src/internal/account";
import { AccountSequenceNumber } from "../../../src/transactions/management/accountSequenceNumber";
import { getAptosClient } from "../helper";

const { aptos, config: aptosConfig } = getAptosClient();

const account = Account.generate();

const accountSequenceNumber = new AccountSequenceNumber(aptosConfig, account, 30, 100, 10);
let getAccountInfoSpy: jest.SpyInstance;

let lastSeqNumber: bigint | null;

describe("account sequence number", () => {
  beforeAll(async () => {
    await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1000000000 });
  }, longTestTimeout);

  beforeEach(() => {
    getAccountInfoSpy = jest.spyOn(AccountQueries, "getInfo");
  });

  afterEach(() => {
    getAccountInfoSpy.mockRestore();
  });

  it(
    "initializes with correct sequence number",
    async () => {
      await accountSequenceNumber.initialize();
      expect(accountSequenceNumber.currentNumber).toEqual(BigInt(0));
      expect(accountSequenceNumber.lastUncommintedNumber).toEqual(BigInt(0));
    },
    longTestTimeout,
  );

  it("updates with correct sequence number", async () => {
    const seqNum = "2";
    getAccountInfoSpy.mockResolvedValue({
      sequence_number: seqNum,
      authentication_key: account.accountAddress.toString(),
    });
    await accountSequenceNumber.update();
    expect(accountSequenceNumber.lastUncommintedNumber).toEqual(BigInt(parseInt(seqNum, 10)));
  });

  it(
    "returns sequential number starting from 0",
    async () => {
      getAccountInfoSpy.mockResolvedValue({
        sequence_number: "0",
        authentication_key: account.accountAddress.toString(),
      });
      for (let seqNum = 0; seqNum < 5; seqNum += 1) {
        /* eslint-disable no-await-in-loop */
        lastSeqNumber = await accountSequenceNumber.nextSequenceNumber();
        expect(lastSeqNumber).toEqual(BigInt(seqNum));
      }
    },
    longTestTimeout,
  );

  it(
    "includes updated on-chain sequnce number in local sequence number",
    async () => {
      const previousSeqNum = "5";
      getAccountInfoSpy.mockResolvedValue({
        sequence_number: previousSeqNum,
        authentication_key: account.accountAddress.toString(),
      });
      for (let seqNum = 0; seqNum < accountSequenceNumber.maximumInFlight; seqNum += 1) {
        /* eslint-disable no-await-in-loop */
        lastSeqNumber = await accountSequenceNumber.nextSequenceNumber();
        expect(lastSeqNumber).toEqual(BigInt(seqNum + parseInt(previousSeqNum, 10)));
      }
    },
    longTestTimeout,
  );

  it(
    "synchronize completes when local and on-chain sequence numbers are equal",
    async () => {
      const nextSequenceNumber = lastSeqNumber! + BigInt(1);

      getAccountInfoSpy.mockResolvedValue({
        sequence_number: nextSequenceNumber.toString(),
        authentication_key: account.accountAddress.toString(),
      });

      expect(accountSequenceNumber.currentNumber).not.toEqual(lastSeqNumber);
      await accountSequenceNumber.synchronize();
      expect(accountSequenceNumber.currentNumber).toEqual(nextSequenceNumber);
    },
    longTestTimeout,
  );
});
