"use client"

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const router = useRouter()
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      setReason(params.get('reason'))
    } catch (e) {
      setReason(null)
    }
  }, [])

  const isAuthError = reason === 'auth'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#092b2b' }}
    >
      <Image
        src="/logoFioraFVerde.png"
        alt="FIORA"
        width={180}
        height={65}
        className="object-contain mb-8"
        priority
      />

      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-6"
        style={{ backgroundColor: 'rgba(191,162,116,0.15)', border: '1px solid rgba(191,162,116,0.3)' }}
      >
        {isAuthError ? '🔐' : '📡'}
      </div>

      <h1 className="text-2xl font-semibold mb-2" style={{ color: '#feffff' }}>
        {isAuthError ? 'Sesión expirada' : 'Sin conexión'}
      </h1>
      
      <p className="text-sm max-w-xs" style={{ color: 'rgba(254,255,255,0.5)' }}>
        {isAuthError 
          ? 'Tu sesión ha expirado. Necesitas conectarte a internet para iniciar sesión nuevamente.'
          : 'Verifica tu conexión a internet e intenta de nuevo. Las páginas que ya visitaste siguen disponibles.'
        }
      </p>

      <button
        onClick={() => {
          if (isAuthError) {
            // Si es error de auth, ir a login
            router.push('/iniciar-sesion')
          } else {
            // Si es offline, reintentar
            window.location.reload()
          }
        }}
        className="mt-8 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
        style={{ backgroundColor: '#bfa274', color: '#092b2b' }}
      >
        {isAuthError ? 'Ir a iniciar sesión' : 'Reintentar'}
      </button>

      {isAuthError && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 rounded-xl font-semibold text-sm transition-opacity"
          style={{ backgroundColor: 'rgba(191,162,116,0.1)', color: '#bfa274', border: '1px solid rgba(191,162,116,0.3)' }}
        >
          Reintentar conexión
        </button>
      )}

      <p className="mt-12 text-xs" style={{ color: 'rgba(254,255,255,0.2)' }}>
        © 2026 FIORA · Sistema de Joyería
      </p>
    </div>
  )
}
