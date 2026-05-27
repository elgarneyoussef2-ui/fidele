import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'

const SALT_ROUNDS = 12

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  // bcrypt hash starts with $2b$ or $2a$
  if (stored.startsWith('$2')) {
    return bcrypt.compare(plain, stored)
  }
  // Legacy SHA-256 hash (40-char hex) — accept but caller should upgrade
  const sha = createHash('sha256').update(plain).digest('hex')
  return sha === stored
}
