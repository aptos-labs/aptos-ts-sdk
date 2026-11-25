import { convertAmountFromHumanReadableToOnChain, convertAmountFromOnChainToHumanReadable } from "../../src/index.js";

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

  test("it converts float amount 500.598 from human readable format to on chain format", () => {
    const value = 500.598;
    const decimals = 8;
    const result = convertAmountFromHumanReadableToOnChain(value, decimals);
    expect(result).toBe(50059800000);
  });

  test("it returns a whole number of smallest units for decimal fractions", () => {
    // 1.1 * 10 ** 8 is 110000000.00000001 in floating point
    expect(convertAmountFromHumanReadableToOnChain(1.1, 8)).toBe(110000000);
    expect(convertAmountFromHumanReadableToOnChain(0.29, 8)).toBe(29000000);
    expect(convertAmountFromHumanReadableToOnChain(0.07, 6)).toBe(70000);
    expect(convertAmountFromHumanReadableToOnChain(19.99, 8)).toBe(1999000000);
  });

  test("it returns the exact smallest units for every two-decimal amount up to 100", () => {
    for (let cents = 1; cents <= 10000; cents += 1) {
      expect(convertAmountFromHumanReadableToOnChain(cents / 100, 8)).toBe(cents * 1000000);
    }
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

  test("it converts float amount 50059800000 from on chain format to human readable format ", () => {
    const value = 50059800000;
    const decimals = 8;
    const result = convertAmountFromOnChainToHumanReadable(value, decimals);
    expect(result).toBe(500.598);
  });
});
