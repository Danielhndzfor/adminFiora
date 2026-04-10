import { PrismaClient } from '@prisma/client'

// Temporary workaround: if Hostinger/UI escapes special chars when saving
// the DATABASE_URL, you can set `DATABASE_URL_B64` to the base64-encoded
// full connection string (no extra escaping). This file will decode it and
// assign to `process.env.DATABASE_URL` before PrismaClient is instantiated.
if (process.env.DATABASE_URL_B64 && !process.env.DATABASE_URL) {
  try {
    const decoded = Buffer.from(process.env.DATABASE_URL_B64, 'base64').toString('utf8')
    process.env.DATABASE_URL = decoded
  } catch (e) {
    // ignore decode errors
  }
}

declare global {
  // to prevent multiple instances of PrismaClient in development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
