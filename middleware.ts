import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificar se a rota é /admin (mas não /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    const adminSession = request.cookies.get('admin-session');
    
    // Se não há sessão válida, redirecionar para login
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
