'use client'

import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { HistoryContent } from '@/components/history-content'

export default function HistorialPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Historial" />
      <main className="px-4 py-4 max-w-lg mx-auto">
        <HistoryContent />
      </main>
      <BottomNav />
    </div>
  )
}
