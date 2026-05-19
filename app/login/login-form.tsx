"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const params = useSearchParams();
  const errorParam = params.get("error");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // If bounced here for using the wrong Google account, end that session.
  useEffect(() => {
    if (errorParam === "denied") {
      setNotice("That Google account isn't authorized for this app.");
      createClient().auth.signOut();
    } else if (errorParam === "auth") {
      setNotice("Sign-in failed. Please try again.");
    }
  }, [errorParam]);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setNotice(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-black text-[#06210f]">
          C
        </div>
        <h1 className="text-xl font-bold">Curbside Finance</h1>
        <p className="mt-1 text-sm text-muted">
          Income &amp; expense tracker for your FiveM server
        </p>

        {notice && (
          <p className="mt-5 rounded-lg border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
            {notice}
          </p>
        )}

        <button
          onClick={signIn}
          disabled={loading}
          className="btn-accent mt-6 flex w-full items-center justify-center gap-2"
        >
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-muted-2">
        Access is restricted to a single authorized account.
      </p>
    </div>
  );
}
