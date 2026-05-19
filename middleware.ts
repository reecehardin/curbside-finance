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
     *  - Next.js internals and static assets
     */
    "/((?!api/tebex|_next/static|_next/image|favicon.ico).*)",
  ],
};
