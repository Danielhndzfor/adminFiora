'use client'

import { useStore } from '@/lib/store'
import { Wifi, WifiOff, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConnectionStatus() {
  const { connectionStatus, pendingSales } = useStore()

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
      connectionStatus === 'online' && 'bg-success/10 text-success',
      connectionStatus === 'offline' && 'bg-destructive/10 text-destructive',
      connectionStatus === 'pending' && 'bg-warning/10 text-warning',
    )}>
      {connectionStatus === 'online' && (
        <>
          <Wifi className="h-3 w-3" />
          <span>En linea</span>
        </>
      )}
      {connectionStatus === 'offline' && (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Sin conexion</span>
        </>
      )}
      {connectionStatus === 'pending' && (
        <>
          <CloudOff className="h-3 w-3" />
          <span>{pendingSales} pendientes</span>
        </>
      )}
    </div>
  )
}
