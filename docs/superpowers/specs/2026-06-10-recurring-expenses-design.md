# Recurring Monthly Expenses — Design

**Date:** 2026-06-10 · **Status:** Approved by user

## Goal

Track the server's recurring monthly subscriptions automatically. The owner can
manage the list (add / edit / pause / delete) on a dedicated **Monthly** tab, and
each subscription's charge is posted into `transactions` on its billing day with
no manual work, so monthly dashboards always reflect real burn.

## Data model

### New table: `recurring_expenses`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text NOT NULL | e.g. "JG+ Subscription" |
| `amount` | numeric(12,2) NOT NULL, > 0 | USD amount charged each month |
| `original_amount` | numeric(12,2) NULL | e.g. 20.00 for the €20 sub (display only) |
| `original_currency` | text NULL | e.g. "EUR", "GBP" |
| `category` | text NULL | same free-text categories as expenses |
| `billing_day` | int NOT NULL, 1–31 | day of month it bills |
| `next_billing_date` | date NOT NULL | next date a charge should post |
| `active` | boolean NOT NULL default true | paused subs never post |
| `created_at` | timestamptz default now() | |

RLS: same single-policy model as `transactions` (full access for `authenticated`;
the cron route uses the service-role key which bypasses RLS).

### Changes to `transactions`

- New nullable column `recurring_expense_id uuid` referencing
  `recurring_expenses(id)` **on delete set null** — deleting a subscription keeps
  its historical expenses.
- New `source` value `'recurring'` added to the existing check constraint.
- **Idempotency:** unique index on `(recurring_expense_id, billing_month)` where
  `billing_month` is a stored `date` column (first day of the charge's month, only
  set for recurring charges). One charge per subscription per calendar month, ever
  — double-posting is impossible even if the cron fires twice.

## Posting mechanism: daily Vercel Cron

- `vercel.json` defines a daily cron (e.g. `0 6 * * *`) hitting
  `GET /api/recurring/post`.
- The route is authenticated by a `CRON_SECRET` env var (Vercel sends it as
  `Authorization: Bearer <secret>`); requests without it get 401. Excluded from
  the auth middleware matcher like the Tebex webhook.
- Logic (service-role client):
  1. Select active subs with `next_billing_date <= today`.
  2. For each, insert a transaction: `type='expense'`, `source='recurring'`,
     `amount`, `description=name`, `category`, `occurred_at = next_billing_date`
     at noon UTC, `recurring_expense_id`, `billing_month`.
  3. On success **or** unique-violation (23505), advance `next_billing_date` by
     one month, clamping the day (31st → last day of shorter months; billing_day
     is the anchor so it returns to the 31st when possible).
  4. Loop handles a sub being multiple periods behind (catch-up posts each missed
     month).
- The same function is callable from a "Post due now" path if ever needed, but no
  extra UI for that (YAGNI).

## UI: Monthly tab

- New sidebar item **Monthly** (`/monthly`) between Expenses and Settings.
- Header shows **total monthly burn** (sum of active subs' USD amounts).
- Table: name (with original currency shown like "€20.00" when set), USD amount,
  category, bills on (day), next billing date, active status.
- Actions: **Add** (modal mirroring the existing AddTransactionModal style),
  **Edit** (same modal pre-filled), **Pause/Resume** toggle, **Delete** (confirm).
- Server actions in `lib/actions.ts` style: `addRecurring`, `updateRecurring`,
  `toggleRecurring`, `deleteRecurring` — validation mirrors `addExpense`.
- Posted charges render in existing Expenses/Dashboard views unchanged; the
  transaction tables show a small "recurring" tag (like the existing tebex/manual
  source distinction).

## Seed data (inserted via SQL, editable afterward)

| Name | USD | Orig | Day | Category | First post |
|---|---|---|---|---|---|
| Multiplayer Jobs Bundle #1 | 65.08 | — | 9 | Assets & Scripts | **backfill Jun 9** |
| 1 Month Subscription – Vehicles | 30.00 | — | 3 | Assets & Scripts | **backfill Jun 3** |
| JG+ Subscription | 34.00 | — | 17 | Assets & Scripts | Jun 17 |
| 50 Weapon Pack HQ Chromium | 29.00 | — | 19 | Assets & Scripts | Jun 19 |
| FiveM Beyond | 30.00 | — | 20 | Assets & Scripts | Jun 20 |
| Element Club Platinum | 50.00 | — | 21 | Server Hosting | Jun 21 |
| CODEWAVE Subscription | 27.00 | £20 | 22 | Assets & Scripts | Jun 22 |
| Server Hosting | 70.00 | — | 22 | Server Hosting | Jun 22 |
| EVP Police and EMS Vehicle Pack | 19.99 | — | 25 | Assets & Scripts | Jun 25 |
| CVP Civilian Vehicle Pack | 14.99 | — | 25 | Assets & Scripts | Jun 25 |
| Gold – 1 month | 23.00 | €20 | 27 | Assets & Scripts | Jun 27 |

Total ≈ **$393.06/mo**. Backfill: the two June charges that already billed are
seeded with `next_billing_date` set to their June date in the past, so the first
cron run (or a manual trigger of the route) posts them immediately and advances
them to July. All others post on their upcoming June date.

EUR/GBP conversions ($23 / $27) are fixed estimates the owner can edit.

## Error handling

- Cron route: per-subscription try/catch — one bad row doesn't block the rest;
  returns a JSON summary `{posted, skipped, errors}`.
- Unique violation treated as success (idempotent), matching the Tebex webhook
  pattern.
- Form validation errors returned as `{ok:false, error}` like existing actions.

## Testing

- Unit tests (Vitest, like `lib/tebex.test.ts`) for the date-advance function:
  month clamp (Jan 31 → Feb 28/29 → Mar 31), catch-up over multiple missed
  months, year rollover.
- Manual verification: hit `/api/recurring/post` locally with the secret and
  confirm the two backfill rows post once and never duplicate.

## Out of scope

- Live FX conversion, yearly/weekly cadences, reminders/notifications,
  multi-user. Single cadence: monthly.
