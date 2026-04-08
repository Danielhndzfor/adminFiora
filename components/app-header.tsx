'use client'

import Image from 'next/image'
import { ConnectionStatus } from './connection-status'
import LogoutButton from '@/components/auth/logout-button'

interface AppHeaderProps {
  title: string
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionStatus />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
