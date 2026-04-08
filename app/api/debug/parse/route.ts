import { NextResponse } from 'next/server'

export async function GET() {
  const v = process.env.DATABASE_URL ?? null
  if (!v) return NextResponse.json({ present: false })
  try {
    const parsed = new URL(v)
    const username = parsed.username || null
    const host = parsed.hostname || null
    const port = parsed.port || null
    const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : null
    const hasPassword = parsed.password ? true : false
    // WARNING: devuelve la URL completa para depuración temporal
    return NextResponse.json({ present: true, username, host, port, database, hasPassword, raw: v })
  } catch (err) {
    return NextResponse.json({ present: true, parsed: false, error: String(err), raw: v })
  }
}
