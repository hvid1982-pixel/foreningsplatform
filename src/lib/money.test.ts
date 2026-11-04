import { describe, expect, it } from "vitest";
import {
  addMoney,
  applyBasisPoints,
  formatMoney,
  money,
  multiplyMoney,
  subtractMoney,
  sumMoney,
  parseKronerToMinor,
  formatMinorAsKronerInput,
} from "./money";

describe("money", () => {
  it("rejects non-integer minor units", () => {
    expect(() => money(10.5)).toThrow(RangeError);
    expect(() => money(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });

  it("adds, subtracts, multiplies and sums exactly", () => {
    expect(addMoney(money(10), money(20)).amountMinor).toBe(30);
    expect(subtractMoney(money(10), money(25)).amountMinor).toBe(-15);
    expect(multiplyMoney(money(1999), 3).amountMinor).toBe(5997);
    expect(sumMoney([money(1), money(2), money(3)]).amountMinor).toBe(6);
    expect(sumMoney([]).amountMinor).toBe(0);
    expect(() => multiplyMoney(money(1), 1.5)).toThrow(RangeError);
  });

  it("applies basis points with half-away-from-zero rounding", () => {
    expect(applyBasisPoints(money(10_000), 1_500).amountMinor).toBe(1_500); // 15 %
    expect(applyBasisPoints(money(5), 1_000).amountMinor).toBe(1); // 0.5 → 1
    expect(applyBasisPoints(money(-5), 1_000).amountMinor).toBe(-1);
    expect(applyBasisPoints(money(4), 1_000).amountMinor).toBe(0);
    expect(applyBasisPoints(money(-4), 1_000).amountMinor).toBe(0);
  });

  it("formats DKK the Danish way", () => {
    expect(formatMoney(money(123_450)).replace(/\s/g, " ")).toBe("1.234,50 kr.");
  });
});

describe("parseKronerToMinor", () => {
  it.each([
    ["1500", 150_000],
    ["1.500", 150_000],
    ["1500,5", 150_050],
    ["1.500,50", 150_050],
    ["1500 kr.", 150_000],
    [" 0 ", 0],
    ["12.345.678,09", 1_234_567_809],
  ])("parses %s", (input, expected) => {
    expect(parseKronerToMinor(input)).toBe(expected);
  });

  it.each(["", "-5", "1,234", "1.50", "abc", "1500,505", "1,5,0"])("rejects %s", (input) => {
    expect(parseKronerToMinor(input)).toBeNull();
  });

  it("round-trips through the input formatter", () => {
    for (const minor of [0, 5, 150_000, 150_050, 99]) {
      expect(parseKronerToMinor(formatMinorAsKronerInput(minor))).toBe(minor);
    }
  });
});
