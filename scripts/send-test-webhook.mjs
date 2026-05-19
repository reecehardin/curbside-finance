/**
 * Sends a correctly-signed fake Tebex webhook to a running instance, so you can
 * test the dashboard without making a real purchase.
 *
 * Usage:
 *   node scripts/send-test-webhook.mjs [completed|refunded] [url] [secret]
 *
 * Defaults: event=completed, url=http://localhost:3000/api/tebex/webhook,
 *           secret=$TEBEX_WEBHOOK_SECRET
 */
import { createHash, createHmac } from "crypto";

const event = process.argv[2] || "completed";
const url =
  process.argv[3] || "http://localhost:3000/api/tebex/webhook";
const secret = process.argv[4] || process.env.TEBEX_WEBHOOK_SECRET;

if (!secret) {
  console.error("No secret. Pass it as arg 3 or set TEBEX_WEBHOOK_SECRET.");
  process.exit(1);
}

const txnId = `tbx-test-${Date.now()}`;
const payload = {
  id: `wh-${Date.now()}`,
  type: event === "refunded" ? "payment.refunded" : "payment.completed",
  date: new Date().toISOString(),
  subject: {
    transaction_id: txnId,
    price: { amount: 24.99, currency: "USD" },
    customer: { first_name: "Test", last_name: "Donor" },
    products: [{ name: "VIP Rank", quantity: 1 }],
  },
};

const body = JSON.stringify(payload);
const bodyHash = createHash("sha256").update(body).digest("hex");
const signature = createHmac("sha256", secret).update(bodyHash).digest("hex");

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Signature": signature },
  body,
});

console.log(`${event} → ${res.status} ${res.statusText}`);
console.log(await res.text());
console.log(`transaction_id: ${txnId}`);
