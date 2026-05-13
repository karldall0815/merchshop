import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed `middleware` → `proxy`. Same edge runtime, same semantics.
//
// We cannot use Prisma in edge code. The gate uses two lightweight signals:
//   1. `merchshop_installed=1` cookie — set after the wizard finishes (and
//      while still useful, easily lost if the user clears cookies)
//   2. presence of any NextAuth session-token cookie — sessions can only be
//      issued after install, so seeing one is a hard proof of install
//
// Treating either as "installed" makes the gate self-heal: a logged-in user
// who lost the install-cookie no longer gets bounced through /setup → /login.

// `/api/jobs` is the cron entrypoint — it runs from a sidecar container that
// has neither a session-cookie nor the installed-cookie, and authenticates
// itself with a shared bearer token instead. Gate it at the route handler.
// `/api/images` is the public side of the upload pipeline; access control
// lives in the route itself, not in the proxy.
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/jobs",
  "/api/images",
  "/health",
  "/_next",
  "/favicon",
  "/assets",
];

// NextAuth v5 session-token cookies follow the patterns:
//   <prefix?>authjs.session-token       (root)
//   <prefix?>authjs.session-token.<n>   (chunked, when JWE is large)
// where <prefix> is `__Secure-` on https. Match liberally.
function hasSessionCookie(req: NextRequest): boolean {
  for (const c of req.cookies.getAll()) {
    if (/authjs\.session-token(\.\d+)?$/.test(c.name) && c.value) return true;
  }
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const sessionPresent = hasSessionCookie(req);
  const installed = req.cookies.get("merchshop_installed")?.value === "1" || sessionPresent;
  const isSetupPath = pathname === "/setup" || pathname.startsWith("/setup/") || pathname.startsWith("/api/setup");
  const allowReinit = process.env.ALLOW_SETUP_REINIT === "true";

  if (installed && isSetupPath && !allowReinit) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (!installed && !isSetupPath && pathname !== "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/setup";
    return NextResponse.redirect(url);
  }

  if (installed && !isSetupPath && !sessionPresent) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
