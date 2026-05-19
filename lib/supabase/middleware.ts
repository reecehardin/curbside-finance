import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes reachable without being signed in. */
const PUBLIC_PATHS = ["/login", "/auth/callback"];

/**
 * Refreshes the Supabase session cookie and enforces access control:
 *  - unauthenticated users are sent to /login
 *  - authenticated users whose email is not ALLOWED_EMAIL are sent to
 *    /login?error=denied (the login page then signs them out)
 *
 * The Tebex webhook route is excluded via the middleware matcher below.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  const allowedEmail = process.env.ALLOWED_EMAIL?.toLowerCase();
  const userEmail = user?.email?.toLowerCase();
  const isAllowed = !!user && !!allowedEmail && userEmail === allowedEmail;

  // Signed-in but wrong account → bounce to login with an error.
  if (user && !isAllowed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "denied");
    return NextResponse.redirect(url);
  }

  // Not signed in → require login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already signed in and allowed → skip the login page.
  if (isAllowed && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
