/**
 * Money is always an integer amount of minor units (øre for DKK) plus a
 * currency code. Never use floating point for amounts. See DECISIONS.md.
 */
export type Currency = "DKK";

export type Money = {
  /** Integer minor units, e.g. 12_550 = 125,50 kr. */
  amountMinor: number;
  currency: Currency;
};

export function money(amountMinor: number, currency: Currency = "DKK"): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError(`Money amount must be an integer number of minor units, got ${amountMinor}`);
  }
  return { amountMinor, currency };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function multiplyMoney(a: Money, quantity: number): Money {
  if (!Number.isInteger(quantity)) throw new RangeError("Quantity must be an integer");
  return money(a.amountMinor * quantity, a.currency);
}

export function sumMoney(items: Money[], currency: Currency = "DKK"): Money {
  return items.reduce((total, item) => addMoney(total, item), money(0, currency));
}

/**
 * Applies a rate in basis points (100 bp = 1 %) and rounds half away from zero
 * to whole minor units. Used for fees; the rounding rule is a reversible default.
 */
export function applyBasisPoints(a: Money, basisPoints: number): Money {
  if (!Number.isInteger(basisPoints)) throw new RangeError("Basis points must be an integer");
  const raw = (a.amountMinor * basisPoints) / 10_000;
  const rounded = Math.sign(raw) * Math.round(Math.abs(raw));
  return money(rounded === 0 ? 0 : rounded, a.currency);
}

const formatters: Record<Currency, Intl.NumberFormat> = {
  DKK: new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" }),
};

/** "1.234,50 kr." */
export function formatMoney(a: Money): string {
  return formatters[a.currency].format(a.amountMinor / 100);
}
