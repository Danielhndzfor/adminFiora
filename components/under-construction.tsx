'use client'

import { ArrowLeft, Wrench } from 'lucide-react'
import Link from 'next/link'

export function UnderConstruction() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#092B2B] to-[#092B2B]/80 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#BFA274]/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative bg-[#BFA274]/10 p-6 rounded-full border-2 border-[#BFA274]/30">
              <Wrench className="h-16 w-16 text-[#BFA274] animate-bounce" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white">En construcción</h1>
          <p className="text-[#feffff]/70 text-lg">
            Esta vista aún se está desarrollando. Vuelve pronto para verla en acción.
          </p>
        </div>

        {/* Button */}
        <Link
          href="/ventas"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#BFA274] hover:bg-[#BFA274]/85 text-[#092B2B] font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a Ventas
        </Link>

        {/* Status */}
        <div className="pt-6 border-t border-[#BFA274]/20">
          <p className="text-sm text-[#feffff]/50">
            Disponible:
          </p>
          <p className="text-[#BFA274] font-semibold text-sm mt-1">
            ✓ Módulo de Ventas
          </p>
        </div>
      </div>
    </div>
  )
}
