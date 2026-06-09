import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

/**
 * Protege todas as páginas internas.
 * Rotas liberadas sem login:
 *  - /login
 *  - /share/...  (links públicos de compartilhamento)
 *  - /api/auth   (endpoint de login)
 *  - arquivos estáticos / áudios públicos
 */
const PUBLIC_PATHS = ["/login", "/share", "/api/auth", "/audios"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // libera caminhos públicos
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifyToken(token, process.env.AUTH_SECRET);

  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // aplica a tudo, exceto assets internos do Next
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
