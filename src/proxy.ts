import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasAppAccess } from '@/server/access';

// Tudo que não está aqui exige sessão (padrão: negar).
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth'];
const AUTH_ROUTES = ['/login', '/signup'];
const INVITE_ROUTE = '/convite';

function matches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Redireciona preservando cookies de sessão renovados nesta requisição.
  const redirectTo = (path: string, next?: string) => {
    const url = new URL(path, request.url);
    if (next) url.searchParams.set('next', next);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (pathname === '/') return redirectTo('/login');
    if (matches(pathname, PUBLIC_ROUTES)) return response;
    return redirectTo('/login', pathname);
  }

  // Sessão válida, mas sem convite na beta privada → tela de convite.
  if (!(await hasAppAccess(supabase, user))) {
    if (pathname === INVITE_ROUTE || matches(pathname, ['/auth'])) return response;
    return redirectTo(INVITE_ROUTE);
  }

  if (pathname === '/' || pathname === INVITE_ROUTE || matches(pathname, AUTH_ROUTES)) {
    return redirectTo('/inicio');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback|manifest.webmanifest|sw.js|offline.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)',
  ],
};
