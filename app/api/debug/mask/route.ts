import { NextResponse } from 'next/server'

export async function GET() {
  const v = process.env.DATABASE_URL ?? null
  if (!v) return NextResponse.json({ db: null })
  const masked = v.replace(/:(.+)@/, ':***@')
  return NextResponse.json({ db: masked })
}
