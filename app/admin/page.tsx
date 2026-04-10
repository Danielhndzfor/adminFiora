'use client'

import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { AdminContent } from '@/components/admin-content'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Menú" />
      <main className="px-4 py-4 max-w-lg mx-auto">
        <AdminContent />
      </main>
      <BottomNav />
    </div>
  )
}
