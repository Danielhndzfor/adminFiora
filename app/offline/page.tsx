'use client'

import Image from 'next/image'

export default function OfflinePage() {
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
        📡
      </div>

      <h1 className="text-2xl font-semibold mb-2" style={{ color: '#feffff' }}>
        Sin conexión
      </h1>
      <p className="text-sm max-w-xs" style={{ color: 'rgba(254,255,255,0.5)' }}>
        Verifica tu conexión a internet e intenta de nuevo. Las páginas que ya visitaste siguen disponibles.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
        style={{ backgroundColor: '#bfa274', color: '#092b2b' }}
      >
        Reintentar
      </button>

      <p className="mt-12 text-xs" style={{ color: 'rgba(254,255,255,0.2)' }}>
        © 2026 FIORA · Sistema de Joyería
      </p>
    </div>
  )
}
