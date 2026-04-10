'use client'

import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { SalesContent } from '@/components/sales-content'
import { Toaster } from '@/components/ui/sonner'

export default function VentasPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Vender" />
      <main className="px-4 py-4 max-w-lg mx-auto">
        <SalesContent />
      </main>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  )
}
