import bcrypt from 'bcrypt'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'tu-secreto-muy-seguro-cambiar-en-produccion'
const SALT_ROUNDS = 10

/**
 * Hash una contraseña con bcrypt
 */
export async function hashearContrasena(contrasena: string): Promise<string> {
  return await bcrypt.hash(contrasena, SALT_ROUNDS)
}

/**
 * Valida una contraseña contra su hash
 */
export async function verificarContrasena(
  contrasena: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(contrasena, hash)
}

/**
 * Genera un JWT para un usuario
 */
export function generarTokenJWT(usuarioId: number, correo: string, expiresIn: string = '7d'): string {
  const signOptions: SignOptions = {
    expiresIn: expiresIn as any,
  }
  const token = jwt.sign(
    {
      usuarioId,
      correo,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    signOptions
  )
  return token
}

/**
 * Verifica y decodifica un JWT
 */
export function verificarTokenJWT(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (err) {
    return null
  }
}

/**
 * Genera un token aleatorio para verificación de email / restablecimiento de contraseña
 */
export function generarTokenAleatorio(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash seguro para tokens (refresh tokens) antes de persistir en DB
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Valida formato de email
 */
export function esEmailValido(correo: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(correo)
}

/**
 * Valida que la contraseña sea segura (mín 8 caracteres, mayúscula, número, especial)
 */
export function esContraseñaSegura(contrasena: string): { valida: boolean; errores: string[] } {
  const errores: string[] = []

  if (contrasena.length < 8) {
    errores.push('Mínimo 8 caracteres')
  }
  if (!/[A-Z]/.test(contrasena)) {
    errores.push('Debe incluir mayúsculas')
  }
  if (!/[0-9]/.test(contrasena)) {
    errores.push('Debe incluir números')
  }
  if (!/[!@#$%^&*]/.test(contrasena)) {
    errores.push('Debe incluir caracteres especiales (!@#$%^&*)')
  }

  return {
    valida: errores.length === 0,
    errores,
  }
}
