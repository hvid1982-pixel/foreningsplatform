import { describe, expect, it } from "vitest";
import {
  addMoney,
  applyBasisPoints,
  formatMoney,
  money,
  multiplyMoney,
  subtractMoney,
  sumMoney,
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
