import PageHeader from "@/components/PageHeader";
import Panel from "@/components/Panel";
import CopyField from "@/components/CopyField";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Prefer the configured site URL; fall back to the request's host.
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (host ? `${proto}://${host}` : "http://localhost:3000");
  const webhookUrl = `${baseUrl}/api/tebex/webhook`;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Connection details and app configuration"
      />

      <div className="space-y-4">
        <Panel title="Tebex Webhook">
          <p className="mb-3 text-sm text-muted">
            In your Tebex Creator Panel, go to{" "}
            <span className="text-text">Webhooks</span> and add this endpoint.
            New donations will then appear here automatically.
          </p>
          <CopyField value={webhookUrl} />
          <p className="mt-3 text-xs text-muted-2">
            Subscribe it to the <span className="text-text">Payment Completed</span>{" "}
            event (and Refund / Chargeback if you want those reflected). Paste the
            webhook secret Tebex shows into the{" "}
            <code className="text-text">TEBEX_WEBHOOK_SECRET</code> environment
            variable.
          </p>
        </Panel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Panel title="Account">
            <div className="label">Authorized Google account</div>
            <div className="mt-1 text-sm">{user?.email}</div>
          </Panel>
          <Panel title="Currency">
            <div className="label">Display currency</div>
            <div className="mt-1 text-sm">
              {process.env.NEXT_PUBLIC_CURRENCY || "USD"}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
