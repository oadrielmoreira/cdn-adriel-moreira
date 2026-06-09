import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/** Gera hash seguro com scrypt + salt aleatório. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(plain, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/** Compara senha em texto com o hash armazenado. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const [hashed, salt] = hash.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(plain, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
