import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Autenticação simples por senha única.
 *
 * - A senha fica na variável de ambiente APP_PASSWORD (troca fácil, sem mexer no código).
 * - Após login correto, gravamos um cookie de sessão assinado (JWT) usando AUTH_SECRET.
 * - O middleware valida esse cookie em todas as rotas protegidas.
 */

const COOKIE_NAME = "cdn_session";
const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET ausente ou muito curto. Defina uma string longa e aleatória nas variáveis de ambiente."
    );
  }
  return new TextEncoder().encode(secret);
}

export function getExpectedPassword(): string {
  return process.env.APP_PASSWORD ?? "cdn@2030";
}

/** Cria o cookie de sessão após senha correta. */
export async function createSession() {
  const token = await new SignJWT({ role: "member" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Remove o cookie de sessão (logout). */
export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Verifica se a sessão atual é válida (para Server Components). */
export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/** Verifica um token isolado (usado no middleware, que roda no edge). */
export async function verifyToken(
  token: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
