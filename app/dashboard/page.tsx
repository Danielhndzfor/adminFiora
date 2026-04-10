'use client'

import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { DashboardContent } from '@/components/dashboard-content'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="FIORA" />
      <main className="px-4 py-4 max-w-lg mx-auto">
        <DashboardContent />
      </main>
      <BottomNav />
    </div>
  )
}
