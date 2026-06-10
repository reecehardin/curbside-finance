# Recurring Monthly Expenses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Monthly" tab to manage recurring subscriptions, with a daily Vercel Cron that posts each subscription as a normal expense transaction on its billing day (idempotently), seeded with the server's 11 current subscriptions.

**Architecture:** New `recurring_expenses` table holds subscription definitions. A cron-hit API route (`/api/recurring/post`, Bearer-secret auth, service-role client) materializes due charges into the existing `transactions` table with `source='recurring'` and a unique `(recurring_expense_id, billing_month)` index for idempotency. Pure date math lives in `lib/recurring.ts` (unit-tested). CRUD via server actions + a Monthly page mirroring the existing Expenses page patterns.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + supabase-js), Tailwind, Vitest, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-06-10-recurring-expenses-design.md`

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `supabase/recurring.sql` | Create | DDL: table, transactions columns, constraint, unique index, RLS, seed |
| `lib/types.ts` | Modify | `RecurringExpense` interface; add `'recurring'` to `TransactionSource` |
| `lib/recurring.ts` | Create | Pure date helpers: `advanceBillingDate`, `nextOccurrence`, `billingMonthOf`, `todayUTC` |
| `lib/recurring.test.ts` | Create | Vitest tests for the date helpers |
| `app/api/recurring/post/route.ts` | Create | Cron endpoint: post due charges, advance dates |
| `middleware.ts` | Modify | Exclude `api/recurring` from session auth |
| `vercel.json` | Create | Daily cron schedule |
| `.env.example`, `.env.local` | Modify | `CRON_SECRET` |
| `lib/recurring-actions.ts` | Create | Server actions: add/update/toggle/delete |
| `components/RecurringModal.tsx` | Create | Add/Edit modal (client) |
| `components/RecurringTable.tsx` | Create | Subscription table with row actions (client) |
| `app/(app)/monthly/page.tsx` | Create | Monthly page |
| `components/SidebarNav.tsx` | Modify | Add "Monthly" nav item |
| `components/TransactionTable.tsx` | Modify | "Recurring" tag on auto-posted expenses |

---

### Task 1: Database migration + seed

**Files:**
- Create: `supabase/recurring.sql`

- [ ] **Step 1: Write the SQL file**

```sql
-- Recurring monthly expenses — run in the Supabase SQL editor (once).
-- Adds the recurring_expenses table, links transactions to it, and seeds
-- the current subscription list (seed only runs if the table is empty).

create table if not exists public.recurring_expenses (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  amount            numeric(12, 2) not null check (amount > 0),
  original_amount   numeric(12, 2),
  original_currency text,
  category          text,
  billing_day       int not null check (billing_day between 1 and 31),
  next_billing_date date not null,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.recurring_expenses enable row level security;

drop policy if exists "authenticated full access" on public.recurring_expenses;
create policy "authenticated full access"
  on public.recurring_expenses
  for all
  to authenticated
  using (true)
  with check (true);

-- Link posted charges back to their subscription. Deleting a subscription
-- keeps its historical expenses (FK set null).
alter table public.transactions
  add column if not exists recurring_expense_id uuid
    references public.recurring_expenses(id) on delete set null,
  add column if not exists billing_month date;

-- Allow the new source value.
alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions add constraint transactions_source_check
  check (source in ('tebex', 'manual', 'recurring'));

-- Idempotency: one posted charge per subscription per calendar month.
create unique index if not exists transactions_recurring_month_key
  on public.transactions (recurring_expense_id, billing_month)
  where recurring_expense_id is not null;

-- Seed (only when the table is empty). The two past-dated rows (Jun 3, Jun 9)
-- are this month's backfill: the first run of /api/recurring/post posts them
-- immediately and advances them to July.
insert into public.recurring_expenses
  (name, amount, original_amount, original_currency, category, billing_day, next_billing_date)
select * from (values
  ('Multiplayer Jobs Bundle #1',        65.08::numeric, null::numeric, null,  'Assets & Scripts', 9,  date '2026-06-09'),
  ('1 Month Subscription – Vehicles',   30.00::numeric, null::numeric, null,  'Assets & Scripts', 3,  date '2026-06-03'),
  ('JG+ Subscription',                  34.00::numeric, null::numeric, null,  'Assets & Scripts', 17, date '2026-06-17'),
  ('50 Weapon Pack HQ Chromium',        29.00::numeric, null::numeric, null,  'Assets & Scripts', 19, date '2026-06-19'),
  ('FiveM Beyond',                      30.00::numeric, null::numeric, null,  'Assets & Scripts', 20, date '2026-06-20'),
  ('Element Club Platinum',             50.00::numeric, null::numeric, null,  'Server Hosting',   21, date '2026-06-21'),
  ('CODEWAVE Subscription',             27.00::numeric, 20.00::numeric, 'GBP', 'Assets & Scripts', 22, date '2026-06-22'),
  ('Server Hosting',                    70.00::numeric, null::numeric, null,  'Server Hosting',   22, date '2026-06-22'),
  ('EVP Police and EMS Vehicle Pack',   19.99::numeric, null::numeric, null,  'Assets & Scripts', 25, date '2026-06-25'),
  ('CVP Civilian Vehicle Pack',         14.99::numeric, null::numeric, null,  'Assets & Scripts', 25, date '2026-06-25'),
  ('Gold – 1 month',                    23.00::numeric, 20.00::numeric, 'EUR', 'Assets & Scripts', 27, date '2026-06-27')
) as seed(name, amount, original_amount, original_currency, category, billing_day, next_billing_date)
where not exists (select 1 from public.recurring_expenses);
```

- [ ] **Step 2: Apply it to Supabase**

Run it via the Supabase SQL editor (project `ikdqjvaxglhjxvsgvusr` → SQL Editor → paste → Run). If executing agentically and the Supabase CLI / a Postgres connection is unavailable, flag this as a **manual step for the user** and continue — later tasks only need the SQL to exist locally; the live DB step is listed again in Task 8.

- [ ] **Step 3: Commit**

```bash
git add supabase/recurring.sql
git commit -m "feat: recurring_expenses schema, transaction linkage, seed data"
```

---

### Task 2: Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add the source value and interface**

In `lib/types.ts`, change line 2:

```ts
export type TransactionSource = "tebex" | "manual" | "recurring";
```

Add `recurring_expense_id` to the `Transaction` interface (after `tebex_transaction_id`):

```ts
  tebex_transaction_id: string | null;
  recurring_expense_id: string | null;
```

Append at the end of the file:

```ts
/** A subscription that bills every month on `billing_day`. */
export interface RecurringExpense {
  id: string;
  name: string;
  /** USD amount posted each month. */
  amount: number;
  /** Original price when the sub bills in another currency (e.g. 20 EUR). */
  original_amount: number | null;
  original_currency: string | null;
  category: string | null;
  /** Day of month it bills, 1–31 (clamped in short months). */
  billing_day: number;
  /** Next date a charge should post, YYYY-MM-DD. */
  next_billing_date: string;
  active: boolean;
  created_at: string;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: RecurringExpense type and recurring transaction source"
```

---

### Task 3: Date helpers (TDD)

**Files:**
- Create: `lib/recurring.test.ts`
- Create: `lib/recurring.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/recurring.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/recurring.test.ts`
Expected: FAIL — `Cannot find module './recurring'` (or equivalent resolve error).

- [ ] **Step 3: Implement `lib/recurring.ts`**

```ts
/**
 * Pure date math for recurring monthly billing. All dates are YYYY-MM-DD
 * strings treated as UTC calendar dates — no Date arithmetic leaks timezones.
 */

function iso(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Days in a month; month1 is 1-12. */
function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Today as a YYYY-MM-DD UTC date string. */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-06-22" → "2026-06-01" (the charge's calendar month, for idempotency). */
export function billingMonthOf(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/**
 * The month after `current`, on `billingDay` clamped to that month's length.
 * billingDay (not current's day) is the anchor, so a sub that bills on the
 * 31st returns to the 31st after passing through February.
 */
export function advanceBillingDate(current: string, billingDay: number): string {
  const [y, m] = current.split("-").map(Number);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return iso(nextY, nextM, Math.min(billingDay, daysInMonth(nextY, nextM)));
}

/**
 * First date on/after `today` that falls on `billingDay` (clamped). Used to
 * set next_billing_date when a subscription is created or its day changes.
 */
export function nextOccurrence(billingDay: number, today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const dayThisMonth = Math.min(billingDay, daysInMonth(y, m));
  if (d <= dayThisMonth) return iso(y, m, dayThisMonth);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return iso(nextY, nextM, Math.min(billingDay, daysInMonth(nextY, nextM)));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/recurring.test.ts`
Expected: PASS — 11 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS (existing `lib/tebex.test.ts` plus the new file).

- [ ] **Step 6: Commit**

```bash
git add lib/recurring.ts lib/recurring.test.ts
git commit -m "feat: recurring billing date helpers"
```

---

### Task 4: Cron posting endpoint

**Files:**
- Create: `app/api/recurring/post/route.ts`
- Modify: `middleware.ts:17`
- Create: `vercel.json`
- Modify: `.env.example`, `.env.local`

- [ ] **Step 1: Create the route**

Create `app/api/recurring/post/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { advanceBillingDate, billingMonthOf, todayUTC } from "@/lib/recurring";
import type { RecurringExpense } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Posts every due recurring expense as a transaction, then advances its
 * next_billing_date. Hit daily by Vercel Cron (vercel.json), which sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically.
 *
 * Idempotent: the unique (recurring_expense_id, billing_month) index makes a
 * duplicate insert a 23505, which we treat as already-posted. A subscription
 * that fell several months behind catches up one month per loop iteration.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayUTC();

  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("active", true)
    .lte("next_billing_date", today);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let posted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sub of (data ?? []) as RecurringExpense[]) {
    let next = sub.next_billing_date;

    while (next <= today) {
      const { error: insertError } = await supabase.from("transactions").insert({
        type: "expense",
        amount: sub.amount,
        description: sub.name,
        category: sub.category,
        occurred_at: `${next}T12:00:00Z`,
        source: "recurring",
        status: "completed",
        recurring_expense_id: sub.id,
        billing_month: billingMonthOf(next),
      });

      if (insertError && insertError.code !== "23505") {
        errors.push(`${sub.name}: ${insertError.message}`);
        break; // don't advance past a real failure; retry next run
      }
      if (insertError) skipped++;
      else posted++;

      next = advanceBillingDate(next, sub.billing_day);
    }

    if (next !== sub.next_billing_date) {
      const { error: updateError } = await supabase
        .from("recurring_expenses")
        .update({ next_billing_date: next })
        .eq("id", sub.id);
      if (updateError) errors.push(`${sub.name}: ${updateError.message}`);
    }
  }

  return NextResponse.json({ posted, skipped, errors });
}
```

- [ ] **Step 2: Exclude the route from session middleware**

In `middleware.ts`, the matcher currently starts with `"/((?!api/tebex|...`. Change it to:

```ts
    "/((?!api/tebex|api/recurring|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt)).*)",
```

(Also update the comment above it: the recurring cron route is authenticated by `CRON_SECRET`, not by session.)

- [ ] **Step 3: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/recurring/post",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- [ ] **Step 4: Add `CRON_SECRET` to env files**

Append to `.env.example`:

```
# --- Recurring expenses cron ---
# Vercel Cron sends this as a Bearer token to /api/recurring/post.
# Set the same value in the Vercel project env vars.
CRON_SECRET=
```

Append to `.env.local` (generate a random value, e.g. `openssl rand -hex 16` or PowerShell `-join ((48..57)+(97..122) | Get-Random -Count 32 | % {[char]$_})`):

```
# --- Recurring expenses cron ---
CRON_SECRET=<generated-value>
```

- [ ] **Step 5: Verify it compiles and the suite passes**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/recurring/post/route.ts middleware.ts vercel.json .env.example
git commit -m "feat: cron endpoint that posts due recurring expenses"
```

(`.env.local` is gitignored — do not add it.)

---

### Task 5: Server actions

**Files:**
- Create: `lib/recurring-actions.ts`

- [ ] **Step 1: Create the actions**

Create `lib/recurring-actions.ts` (mirrors the validation/return style of `lib/actions.ts`):

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nextOccurrence, todayUTC } from "@/lib/recurring";
import type { ActionResult } from "@/lib/actions";

interface RecurringInput {
  name: string;
  amount: number;
  original_amount: number | null;
  original_currency: string | null;
  category: string | null;
  billing_day: number;
}

/** Parses + validates the shared Add/Edit form fields. */
function parseForm(formData: FormData): RecurringInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const amount = Number(String(formData.get("amount") ?? "").trim());
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a USD amount greater than 0." };
  }

  const billingDay = Number(String(formData.get("billing_day") ?? "").trim());
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
    return { error: "Billing day must be between 1 and 31." };
  }

  const originalRaw = String(formData.get("original_amount") ?? "").trim();
  const originalCurrency = String(formData.get("original_currency") ?? "").trim();
  let original_amount: number | null = null;
  let original_currency: string | null = null;
  if (originalRaw && originalCurrency && originalCurrency !== "USD") {
    const parsed = Number(originalRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { error: "Original amount must be greater than 0." };
    }
    original_amount = parsed;
    original_currency = originalCurrency;
  }

  const category = String(formData.get("category") ?? "").trim();

  return {
    name,
    amount,
    original_amount,
    original_currency,
    category: category || null,
    billing_day: billingDay,
  };
}

/** Creates a subscription; first charge posts on its next billing-day occurrence. */
export async function addRecurring(formData: FormData): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").insert({
    ...parsed,
    next_billing_date: nextOccurrence(parsed.billing_day, todayUTC()),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}

/** Edits a subscription; recomputes the next charge date only if the day changed. */
export async function updateRecurring(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("recurring_expenses")
    .select("billing_day")
    .eq("id", id)
    .single();
  if (fetchError) return { ok: false, error: fetchError.message };

  const update: Record<string, unknown> = { ...parsed };
  if (existing.billing_day !== parsed.billing_day) {
    update.next_billing_date = nextOccurrence(parsed.billing_day, todayUTC());
  }

  const { error } = await supabase
    .from("recurring_expenses")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}

/** Pauses or resumes a subscription. Paused subs never post. */
export async function toggleRecurring(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const update: Record<string, unknown> = { active };
  // On resume, skip any periods missed while paused instead of back-billing.
  if (active) {
    const { data: existing, error: fetchError } = await supabase
      .from("recurring_expenses")
      .select("billing_day")
      .eq("id", id)
      .single();
    if (fetchError) return { ok: false, error: fetchError.message };
    update.next_billing_date = nextOccurrence(existing.billing_day, todayUTC());
  }

  const { error } = await supabase
    .from("recurring_expenses")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}

/** Deletes a subscription. Past posted expenses are kept (FK set-null). */
export async function deleteRecurring(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly");
  return { ok: true };
}
```

Note: `ActionResult` is already exported from `lib/actions.ts` (an interface — importing it from a `"use server"` module is fine since it's type-only; use `import type`).

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/recurring-actions.ts
git commit -m "feat: server actions for recurring expense CRUD"
```

---

### Task 6: Monthly page UI

**Files:**
- Create: `components/RecurringModal.tsx`
- Create: `components/RecurringTable.tsx`
- Create: `app/(app)/monthly/page.tsx`
- Modify: `components/SidebarNav.tsx`

- [ ] **Step 1: Create `components/RecurringModal.tsx`**

Add/Edit modal, styled exactly like `AddTransactionModal`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { addRecurring, updateRecurring } from "@/lib/recurring-actions";
import { EXPENSE_CATEGORIES, type RecurringExpense } from "@/lib/types";

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

/**
 * Add (no `initial`) or Edit (`initial` set) a recurring subscription.
 */
export default function RecurringModal({
  initial,
}: {
  initial?: RecurringExpense;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(
    initial?.original_currency ?? "USD",
  );

  const isEdit = !!initial;

  function openModal() {
    setError(null);
    setCurrency(initial?.original_currency ?? "USD");
    setOpen(true);
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = isEdit
      ? await updateRecurring(initial.id, formData)
      : await addRecurring(formData);
    setPending(false);

    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={openModal}
          className="text-muted-2 transition-colors hover:text-text"
          aria-label={`Edit ${initial.name}`}
        >
          <Pencil size={15} />
        </button>
      ) : (
        <button onClick={openModal} className="btn-primary">
          <Plus size={16} />
          Add Subscription
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 p-4 backdrop-blur-sm"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="card w-full max-w-md animate-fade-up p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="heading text-lg text-text">
                  {isEdit ? "Edit Subscription" : "Add Subscription"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Billed automatically every month on its billing day.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-2 transition-colors hover:text-text"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form action={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  name="name"
                  required
                  autoFocus
                  defaultValue={initial?.name}
                  placeholder="e.g. JG+ Subscription"
                  className="input mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (USD)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={initial?.amount}
                    placeholder="0.00"
                    className="input mt-1.5"
                  />
                </div>
                <div>
                  <label className="label">Bills on day</label>
                  <input
                    name="billing_day"
                    type="number"
                    min="1"
                    max="31"
                    required
                    defaultValue={initial?.billing_day}
                    placeholder="1–31"
                    className="input mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Billed currency</label>
                  <select
                    name="original_currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input mt-1.5 cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    {currency === "USD" ? "—" : `Price in ${currency}`}
                  </label>
                  <input
                    name="original_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    disabled={currency === "USD"}
                    defaultValue={initial?.original_amount ?? undefined}
                    placeholder={currency === "USD" ? "n/a" : "0.00"}
                    className="input mt-1.5 disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  name="category"
                  defaultValue={initial?.category ?? EXPENSE_CATEGORIES[0]}
                  className="input mt-1.5 cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Create `components/RecurringTable.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { deleteRecurring, toggleRecurring } from "@/lib/recurring-actions";
import { formatDate, formatMoney } from "@/lib/format";
import type { RecurringExpense } from "@/lib/types";
import RecurringModal from "./RecurringModal";

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : ["th", "st", "nd", "rd"][Math.min(n % 10, 4)] ?? "th";
  return `${n}${suffix}`;
}

function originalPrice(sub: RecurringExpense): string | null {
  if (!sub.original_amount || !sub.original_currency) return null;
  const symbol =
    sub.original_currency === "EUR"
      ? "€"
      : sub.original_currency === "GBP"
        ? "£"
        : `${sub.original_currency} `;
  return `${symbol}${Number(sub.original_amount).toFixed(2)}`;
}

export default function RecurringTable({ rows }: { rows: RecurringExpense[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onToggle(sub: RecurringExpense) {
    setBusyId(sub.id);
    await toggleRecurring(sub.id, !sub.active);
    setBusyId(null);
    router.refresh();
  }

  async function onDelete(sub: RecurringExpense) {
    if (!confirm(`Delete "${sub.name}"? Past posted expenses are kept.`)) return;
    setBusyId(sub.id);
    await deleteRecurring(sub.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <Th>Subscription</Th>
            <Th>Category</Th>
            <Th>Bills on</Th>
            <Th>Next charge</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Status</Th>
            <Th className="text-right"></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sub) => {
            const orig = originalPrice(sub);
            const busy = busyId === sub.id;
            return (
              <tr
                key={sub.id}
                className={`border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2/60 ${
                  sub.active ? "" : "opacity-50"
                }`}
              >
                <td className="px-4 py-3 text-text">
                  {sub.name}
                  {orig && (
                    <span className="ml-2 text-xs text-muted-2">({orig}/mo)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {sub.category || "Uncategorized"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {ordinal(sub.billing_day)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {sub.active ? formatDate(`${sub.next_billing_date}T12:00:00Z`) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-display font-semibold text-expense">
                  −{formatMoney(Number(sub.amount))}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`rounded px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide ${
                      sub.active
                        ? "bg-income/12 text-income"
                        : "bg-surface-2 text-muted-2"
                    }`}
                  >
                    {sub.active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <RecurringModal initial={sub} />
                    <button
                      onClick={() => onToggle(sub)}
                      disabled={busy}
                      className="text-muted-2 transition-colors hover:text-text disabled:opacity-40"
                      aria-label={sub.active ? `Pause ${sub.name}` : `Resume ${sub.name}`}
                    >
                      {sub.active ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      onClick={() => onDelete(sub)}
                      disabled={busy}
                      className="text-muted-2 transition-colors hover:text-expense disabled:opacity-40"
                      aria-label={`Delete ${sub.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 font-display text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-2 ${className}`}
    >
      {children}
    </th>
  );
}
```

- [ ] **Step 3: Create `app/(app)/monthly/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import RecurringModal from "@/components/RecurringModal";
import RecurringTable from "@/components/RecurringTable";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import type { RecurringExpense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MonthlyPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .order("billing_day", { ascending: true });
  if (error) throw new Error(`Failed to load subscriptions: ${error.message}`);

  const subs = (data ?? []) as RecurringExpense[];
  const active = subs.filter((s) => s.active);
  const monthlyTotal = active.reduce((acc, s) => acc + Number(s.amount), 0);

  return (
    <>
      <PageHeader
        title="Monthly Expenses"
        subtitle={`${formatMoney(monthlyTotal)}/month across ${active.length} active subscription${active.length === 1 ? "" : "s"}`}
      >
        <RecurringModal />
      </PageHeader>

      {subs.length ? (
        <RecurringTable rows={subs} />
      ) : (
        <EmptyState message="No subscriptions yet. Use “Add Subscription” to track one." />
      )}
    </>
  );
}
```

- [ ] **Step 4: Add the nav item**

In `components/SidebarNav.tsx`, add `CalendarClock` to the lucide import and insert a row in `ITEMS` between Expenses and Settings:

```ts
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Settings,
  type LucideIcon,
} from "lucide-react";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: ArrowDownLeft },
  { href: "/expenses", label: "Expenses", icon: ArrowUpRight },
  { href: "/monthly", label: "Monthly", icon: CalendarClock },
  { href: "/settings", label: "Settings", icon: Settings },
];
```

- [ ] **Step 5: Verify compile + dev render**

Run: `npx tsc --noEmit && npm test`
Expected: clean. Then `npm run dev`, open `http://localhost:3000/monthly` — page renders (empty state until the SQL has been applied; that's fine).

- [ ] **Step 6: Commit**

```bash
git add components/RecurringModal.tsx components/RecurringTable.tsx "app/(app)/monthly/page.tsx" components/SidebarNav.tsx
git commit -m "feat: Monthly tab with subscription management UI"
```

---

### Task 7: Recurring tag on expense rows

**Files:**
- Modify: `components/TransactionTable.tsx:37`

- [ ] **Step 1: Tag auto-posted expenses**

In `components/TransactionTable.tsx`, change the description cell from:

```tsx
                <td className="px-4 py-3 text-text">{t.description}</td>
```

to:

```tsx
                <td className="px-4 py-3 text-text">
                  {t.description}
                  {t.source === "recurring" && (
                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide text-primary-bright">
                      Recurring
                    </span>
                  )}
                </td>
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/TransactionTable.tsx
git commit -m "feat: tag auto-posted recurring expenses in tables"
```

---

### Task 8: End-to-end verification + deploy

**Files:** none new.

- [ ] **Step 1: Apply the SQL** (if not done in Task 1)

Supabase dashboard → SQL Editor → paste `supabase/recurring.sql` → Run. Verify: `select count(*) from recurring_expenses;` → 11.

- [ ] **Step 2: Trigger the backfill locally**

With `npm run dev` running:

```powershell
$secret = (Get-Content .env.local | Select-String '^CRON_SECRET=').ToString().Split('=')[1]
Invoke-RestMethod -Uri "http://localhost:3000/api/recurring/post" -Headers @{ Authorization = "Bearer $secret" }
```

Expected: `{ posted: 2, skipped: 0, errors: [] }` — the Jun 3 Vehicles sub and Jun 9 Jobs Bundle backfill. Run it **again**: `{ posted: 0, skipped: 0, errors: [] }` (both advanced to July, nothing due). Check `/monthly` (next dates moved to Jul 3 / Jul 9) and `/expenses` (two new tagged rows).

- [ ] **Step 3: Verify unauthorized requests are rejected**

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/recurring/post" -SkipHttpErrorCheck | Select-Object StatusCode
```

Expected: 401.

- [ ] **Step 4: Full build + tests**

Run: `npm test && npm run build`
Expected: tests PASS, build succeeds.

- [ ] **Step 5: Deploy**

```bash
git push origin main
```

Then (manual or via Vercel CLI/API): add `CRON_SECRET` to the Vercel project env vars (same value as local, or a fresh one) and confirm the cron appears under Project → Settings → Cron Jobs after the deploy. Hit the deployed endpoint once with the bearer secret to verify in production.

- [ ] **Step 6: Final commit if anything changed, and confirm clean tree**

```bash
git status
```

Expected: clean.
