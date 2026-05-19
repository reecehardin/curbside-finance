import { describe, it, expect } from "vitest";
import { createHash, createHmac } from "crypto";
import {
  computeSignature,
  verifyTebexSignature,
  parsePayment,
  REFUND_EVENTS,
} from "./tebex";

const SECRET = "test-webhook-secret";

describe("computeSignature", () => {
  it("matches the documented scheme: hmac(secret, sha256(body))", () => {
    const body = '{"hello":"world"}';
    const bodyHash = createHash("sha256").update(body).digest("hex");
    const expected = createHmac("sha256", SECRET).update(bodyHash).digest("hex");
    expect(computeSignature(body, SECRET)).toBe(expected);
  });
});

describe("verifyTebexSignature", () => {
  const body = '{"type":"payment.completed"}';

  it("accepts a correctly signed body", () => {
    const sig = computeSignature(body, SECRET);
    expect(verifyTebexSignature(body, sig, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = computeSignature(body, SECRET);
    expect(verifyTebexSignature(body + " ", sig, SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const sig = computeSignature(body, SECRET);
    expect(verifyTebexSignature(body, sig, "other-secret")).toBe(false);
  });

  it("rejects when the signature or secret is missing", () => {
    expect(verifyTebexSignature(body, null, SECRET)).toBe(false);
    expect(verifyTebexSignature(body, "abc", undefined)).toBe(false);
  });
});

describe("parsePayment", () => {
  const webhook = {
    id: "wh-1",
    type: "payment.completed",
    date: "2026-05-18T10:00:00Z",
    subject: {
      transaction_id: "tbx-abc123",
      price: { amount: 25.5, currency: "USD" },
      customer: { first_name: "Donor", last_name: "Tom" },
      products: [
        { name: "VIP Rank", quantity: 1 },
        { name: "Cash Pack", quantity: 2 },
      ],
    },
  };

  it("extracts the fields we store", () => {
    const p = parsePayment(webhook)!;
    expect(p.tebexTransactionId).toBe("tbx-abc123");
    expect(p.amount).toBe(25.5);
    expect(p.currency).toBe("USD");
    expect(p.customerName).toBe("Donor Tom");
    expect(p.description).toBe("VIP Rank, Cash Pack ×2");
    expect(p.occurredAt).toBe("2026-05-18T10:00:00.000Z");
  });

  it("returns null without a transaction id", () => {
    expect(parsePayment({ subject: { price: { amount: 5 } } })).toBeNull();
  });

  it("returns null without a usable amount", () => {
    expect(
      parsePayment({ subject: { transaction_id: "tbx-x", price: {} } }),
    ).toBeNull();
  });

  it("falls back to a generic description when no products are listed", () => {
    const p = parsePayment({
      subject: { transaction_id: "tbx-y", price: { amount: 10 } },
    })!;
    expect(p.description).toBe("Tebex purchase");
    expect(p.customerName).toBeNull();
  });
});

describe("REFUND_EVENTS", () => {
  it("includes refunds and chargebacks but not completed payments", () => {
    expect(REFUND_EVENTS.has("payment.refunded")).toBe(true);
    expect(REFUND_EVENTS.has("payment.chargeback")).toBe(true);
    expect(REFUND_EVENTS.has("payment.completed")).toBe(false);
  });
});
