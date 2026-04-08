import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const res = NextResponse.json({ mensaje: 'Sesión cerrada' }, { status: 200 })
    // Eliminar cookie httpOnly `token`
    res.cookies.set('token', '', { maxAge: 0, path: '/' })
    return res
  } catch (err) {
    console.error('Error en logout:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
