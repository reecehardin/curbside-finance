import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyTebexSignature,
  parsePayment,
  REFUND_EVENTS,
  type TebexWebhook,
} from "@/lib/tebex";

// Tebex sends webhooks server-to-server; never cache or pre-render this route.
export const dynamic = "force-dynamic";

/**
 * Tebex webhook receiver.
 *
 * Authentication is by `X-Signature` HMAC (see lib/tebex.ts) — not by user
 * session — so the middleware matcher excludes this path.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const secret = process.env.TEBEX_WEBHOOK_SECRET;

  if (!verifyTebexSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let webhook: TebexWebhook;
  try {
    webhook = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Handshake Tebex performs when the endpoint is first added.
  if (webhook.type === "validation.webhook") {
    return NextResponse.json({ id: webhook.id });
  }

  const supabase = createAdminClient();

  if (webhook.type === "payment.completed") {
    const payment = parsePayment(webhook);
    if (!payment) {
      return NextResponse.json({ error: "unparseable payload" }, { status: 422 });
    }

    const { error } = await supabase.from("transactions").insert({
      type: "income",
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      customer_name: payment.customerName,
      occurred_at: payment.occurredAt,
      source: "tebex",
      status: "completed",
      tebex_transaction_id: payment.tebexTransactionId,
      raw_payload: webhook,
    });

    // 23505 = unique violation: this transaction was already recorded
    // (Tebex retried the webhook). Idempotent — treat as success.
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (REFUND_EVENTS.has(webhook.type ?? "")) {
    const payment = parsePayment(webhook);
    if (payment) {
      await supabase
        .from("transactions")
        .update({ status: "refunded" })
        .eq("tebex_transaction_id", payment.tebexTransactionId);
    }
    return NextResponse.json({ ok: true });
  }

  // Unhandled event type — acknowledge so Tebex doesn't keep retrying.
  return NextResponse.json({ ok: true, ignored: webhook.type });
}
