import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * Tebex webhook helpers.
 *
 * Signature scheme (per Tebex docs): SHA256-hash the raw JSON body, then build
 * an HMAC-SHA256 using that hash as the message and the webhook secret as the
 * key. The signature arrives in the `X-Signature` header as hex.
 * Docs: https://docs.tebex.io/developers/webhooks/overview
 */

/** Computes the expected hex signature for a raw request body. */
export function computeSignature(rawBody: string, secret: string): string {
  const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  return createHmac("sha256", secret).update(bodyHash).digest("hex");
}

/** Timing-safe check of an incoming `X-Signature` header. */
export function verifyTebexSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) return false;
  const expected = computeSignature(rawBody, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface TebexWebhook {
  id?: string;
  type?: string;
  date?: string;
  subject?: Record<string, unknown>;
}

export interface ParsedPayment {
  tebexTransactionId: string;
  amount: number;
  currency: string;
  customerName: string | null;
  description: string;
  occurredAt: string;
}

/**
 * Extracts the fields we store from a `payment.completed` (or refund) webhook.
 * Returns null if the payload is missing a usable transaction id or amount.
 */
export function parsePayment(webhook: TebexWebhook): ParsedPayment | null {
  const subject = (webhook.subject ?? {}) as Record<string, any>;

  const tebexTransactionId =
    subject.transaction_id ?? subject.id ?? null;
  if (!tebexTransactionId) return null;

  const price = subject.price ?? {};
  const amount = Number(price.amount ?? subject.amount);
  if (!Number.isFinite(amount)) return null;

  const currency: string = price.currency ?? subject.currency ?? "USD";

  const customer = subject.customer ?? {};
  const customerName =
    [customer.first_name, customer.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    customer.username ||
    customer.email ||
    null;

  const products: any[] = Array.isArray(subject.products)
    ? subject.products
    : [];
  const description =
    products
      .map((p) =>
        p?.quantity && p.quantity > 1 ? `${p.name} ×${p.quantity}` : p?.name,
      )
      .filter(Boolean)
      .join(", ") || "Tebex purchase";

  const occurredAt = webhook.date
    ? new Date(webhook.date).toISOString()
    : new Date().toISOString();

  return {
    tebexTransactionId: String(tebexTransactionId),
    amount,
    currency,
    customerName,
    description,
    occurredAt,
  };
}

/** Webhook event types that mean "money was reversed". */
export const REFUND_EVENTS = new Set([
  "payment.refunded",
  "payment.refund",
  "payment.chargeback",
  "payment.dispute.lost",
]);
