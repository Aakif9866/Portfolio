import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { recordVisit } from "@/lib/visits";

/**
 * Counts page views and guards /admin. Public pages never wait on the network here:
 * the visit is recorded after the response is sent (waitUntil), and the Supabase
 * session is only refreshed on /admin and /login, the only routes that read it.
 */
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname === "/login";

  if (!isAdmin && !isLogin) {
    // Real navigations only, not Link prefetches. A failed count must never affect the page.
    if (!request.headers.get("next-router-prefetch")) event.waitUntil(recordVisit().catch(() => {}));
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (isAdmin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  // A signed-in user on /login goes to the admin dashboard — unless /admin just sent them
  // back here as not allowlisted (?error=…); redirecting again would loop forever.
  if (isLogin && user && !request.nextUrl.searchParams.has("error")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/site";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Static assets, generated icons and data routes are neither page views nor session-bearing.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|search.json|.*\\.(?:svg|png|jpg|webp|json|xml)$).*)"],
};
