# Curbside Finance

A clean, single-user web app for tracking your FiveM server's money. Income from
**Tebex** donations is recorded automatically via a webhook; expenses are added by
hand. The dashboard shows income, expenses, net profit, and analytics at a glance.

- **Auth:** Google sign-in (Supabase), locked to one allowed account
- **Income:** auto-recorded from Tebex `payment.completed` webhooks
- **Expenses:** manual entry with categories
- **Dashboard:** summary cards, income-vs-expenses chart, top packages, expense
  breakdown donut, recent activity
- **Stack:** Next.js (App Router) · Supabase (Postgres + Auth) · Tailwind · Recharts

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql)
   and run it. This creates the `transactions` table, indexes, and RLS policy.
3. **Authentication → Providers → Google** → enable it. You'll fill in the Client
   ID / Secret in step 2.
4. **Project Settings → API** → copy the **Project URL**, the **anon** key, and the
   **service_role** key for the env vars below.

## 2. Google OAuth setup

1. In [Google Cloud Console](https://console.cloud.google.com/) create an **OAuth
   client ID** of type **Web application**.
2. Add this **Authorized redirect URI** (from your Supabase project):
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Paste the generated **Client ID** and **Client Secret** into Supabase's Google
   provider (step 1.3) and save.
4. In **Supabase → Authentication → URL Configuration**, set the **Site URL** to
   your app URL and add `<app-url>/auth/callback` to **Redirect URLs** (add both the
   local `http://localhost:3000` and your deployed URL).

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill it in:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (server-only) |
| `ALLOWED_EMAIL` | The single Google account allowed to sign in |
| `TEBEX_WEBHOOK_SECRET` | Webhook secret from Tebex (step 5) |
| `NEXT_PUBLIC_CURRENCY` | Display currency, e.g. `USD` |
| `NEXT_PUBLIC_SITE_URL` | App base URL (used to show the webhook URL) |

## 4. Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # run unit tests
```

## 5. Deploy to Vercel + connect Tebex

1. Push the repo to GitHub and import it into [Vercel](https://vercel.com).
2. Add every variable from step 3 to the Vercel project (set `NEXT_PUBLIC_SITE_URL`
   to the deployed URL). Redeploy.
3. Add the deployed URL to Supabase's redirect URLs (step 2.4).
4. Open the deployed app, sign in, and go to **Settings** — it shows your webhook
   URL: `https://<your-app>/api/tebex/webhook`.
5. In the **Tebex Creator Panel → Webhooks**, add that URL as an endpoint and
   subscribe it to **Payment Completed** (and **Refund** / **Chargeback** if you
   want reversals reflected).
6. Copy the **webhook secret** Tebex shows into the `TEBEX_WEBHOOK_SECRET` env var
   and redeploy. Then re-trigger validation in Tebex — the endpoint should verify.

Donations will now appear on the dashboard automatically.

## Testing the webhook

With the dev server running, send a signed fake donation:

```bash
node scripts/send-test-webhook.mjs completed
node scripts/send-test-webhook.mjs refunded http://localhost:3000/api/tebex/webhook <secret>
```

A `completed` event adds an income row; sending the same one twice does **not**
duplicate it (idempotent on the Tebex transaction id).

## Project structure

```
app/
  (app)/            Authenticated pages: dashboard, income, expenses, settings
  api/tebex/webhook Tebex webhook receiver
  auth/             OAuth callback + sign-out
  login/            Google sign-in
components/         UI: sidebar, cards, charts, tables, modal
lib/
  queries.ts        Period-aware dashboard aggregation
  tebex.ts          Webhook signature verification + payload parsing
  actions.ts        Server actions (add / delete expense)
  supabase/         Supabase clients (server, browser, admin, middleware)
supabase/schema.sql Database schema
```
