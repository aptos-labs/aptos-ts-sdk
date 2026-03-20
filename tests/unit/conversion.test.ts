import { convertAmountFromHumanReadableToOnChain, convertAmountFromOnChainToHumanReadable } from "../../src";

describe("conversion", () => {
  test("it converts amount from human readable format to on chain format", () => {
    const value = 500;
    const decimals = 8;
    const result = convertAmountFromHumanReadableToOnChain(value, decimals);
    expect(result).toBe(50000000000);
  });

  test("it converts float amount from human readable format to on chain format", () => {
    const value = 500.5;
    const decimals = 8;
    const result = convertAmountFromHumanReadableToOnChain(value, decimals);
    expect(result).toBe(50050000000);
  });

  test("it converts float amount from human readable format to on chain format", () => {
    const value = 500.598;
    const decimals = 8;
    const result = convertAmountFromHumanReadableToOnChain(value, decimals);
    expect(result).toBe(50059800000);
  });

  test("it converts amount from on chain format to human readable format ", () => {
    const value = 50000000000;
    const decimals = 8;
    const result = convertAmountFromOnChainToHumanReadable(value, decimals);
    expect(result).toBe(500);
  });

  test("it converts float amount from on chain format to human readable format ", () => {
    const value = 50050000000;
    const decimals = 8;
    const result = convertAmountFromOnChainToHumanReadable(value, decimals);
    expect(result).toBe(500.5);
  });

  test("it converts float amount from on chain format to human readable format ", () => {
    const value = 50059800000;
    const decimals = 8;
    const result = convertAmountFromOnChainToHumanReadable(value, decimals);
    expect(result).toBe(500.598);
  });
});
