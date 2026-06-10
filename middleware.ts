import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all routes except:
     *  - the Tebex webhook (authenticated by signature, not by session)
     *  - the recurring cron route (authenticated by CRON_SECRET Bearer token,
     *    not by session — called by Vercel Cron, not a browser)
     *  - Next.js internals
     *  - static asset files (images, fonts) — so e.g. /logo.png is served
     *    directly instead of being redirected to /login
     */
    "/((?!api/tebex|api/recurring|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt)).*)",
  ],
};
