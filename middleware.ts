import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Check for secret admin route
  const adminSecretRoute = process.env.ADMIN_SECRET_ROUTE;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && adminSecretRoute) {
    // Check if the secret route parameter is present
    const secretParam = request.nextUrl.searchParams.get("secret");
    if (secretParam !== adminSecretRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Verificar se a rota é /admin (mas não /admin/login)
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin/login"
  ) {
    const adminSession = request.cookies.get("admin-session");

    // Se não há sessão válida, redirecionar para login
    if (!adminSession || adminSession.value !== "authenticated") {
      const loginUrl = adminSecretRoute
        ? `/admin/login?secret=${adminSecretRoute}`
        : "/admin/login";
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
