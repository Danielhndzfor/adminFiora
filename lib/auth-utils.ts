import * as crypto from 'crypto'

/**
 * NOTA: En producción, usa bcrypt o argon2.
 * Este es un placeholder básico para desarrollo.
 * Instala: npm install bcrypt
 */

/**
 * Hash una contraseña (placeholder - REEMPLAZAR CON BCRYPT)
 */
export function hashPassword(password: string): string {
  // TODO: Usar bcrypt en producción
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * Valida una contraseña contra su hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  // TODO: Usar bcrypt en producción
  return hashPassword(password) === hash
}

/**
 * Valida el formato de un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida que la contraseña tenga al menos 8 caracteres
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8
}
