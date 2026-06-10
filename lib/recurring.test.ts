import { describe, expect, it } from "vitest";
import {
  advanceBillingDate,
  billingMonthOf,
  nextOccurrence,
} from "./recurring";

describe("advanceBillingDate", () => {
  it("moves to the same day next month", () => {
    expect(advanceBillingDate("2026-06-22", 22)).toBe("2026-07-22");
  });

  it("clamps to the last day of short months", () => {
    expect(advanceBillingDate("2026-01-31", 31)).toBe("2026-02-28");
  });

  it("clamps to Feb 29 in leap years", () => {
    expect(advanceBillingDate("2028-01-31", 31)).toBe("2028-02-29");
  });

  it("returns to the anchor day after a clamped month", () => {
    expect(advanceBillingDate("2026-02-28", 31)).toBe("2026-03-31");
  });

  it("rolls over the year", () => {
    expect(advanceBillingDate("2026-12-09", 9)).toBe("2027-01-09");
  });
});

describe("nextOccurrence", () => {
  it("uses this month when the day hasn't passed", () => {
    expect(nextOccurrence(22, "2026-06-10")).toBe("2026-06-22");
  });

  it("uses this month when today IS the billing day", () => {
    expect(nextOccurrence(10, "2026-06-10")).toBe("2026-06-10");
  });

  it("uses next month when the day already passed", () => {
    expect(nextOccurrence(3, "2026-06-10")).toBe("2026-07-03");
  });

  it("clamps within the current month", () => {
    expect(nextOccurrence(31, "2026-02-10")).toBe("2026-02-28");
  });

  it("rolls over the year", () => {
    expect(nextOccurrence(5, "2026-12-20")).toBe("2027-01-05");
  });
});

describe("billingMonthOf", () => {
  it("returns the first of the month", () => {
    expect(billingMonthOf("2026-06-22")).toBe("2026-06-01");
  });
});
