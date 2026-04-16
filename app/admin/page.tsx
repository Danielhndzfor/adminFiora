'use client'

import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { AdminContent } from '@/components/admin-content'
import { PWASettings } from '@/components/pwa-settings'
import { Card } from '@/components/ui/card'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Menú" />

      <main className="px-4 py-6 max-w-6xl mx-auto">
        {/* Hero */}
        <section className="mb-6">
          <div className="rounded-2xl bg-white/60 backdrop-blur-sm p-4 border border-[#092B2B]/6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#092B2B]">Panel de Administración</h2>
                <p className="text-sm text-[#092B2B]/60 mt-1 max-w-prose">
                  Gestiona catálogos, roles, métodos de pago y ajustes de la aplicación.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#092B2B] text-white text-sm shadow-sm"
                >
                  Ir a configuración
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid: Admin content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-4">
              <AdminContent />
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
