'use client'

import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { InventoryContent } from '@/components/inventory-content'
import { Toaster } from '@/components/ui/sonner'

export default function InventarioPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Inventario" />
      <main className="px-4 py-4 max-w-lg mx-auto">
        <InventoryContent />
      </main>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  )
}
