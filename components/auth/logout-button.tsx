'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LogOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleLogout() {
    setCargando(true)
    try {
      const res = await fetch('/api/autenticacion/logout', { method: 'POST' })
      if (!res.ok) {
        toast.error('Error cerrando sesión')
        setCargando(false)
        return
      }
      // Limpiar datos del cliente
      localStorage.removeItem('usuario')
      toast.success('Sesión cerrada')
      setOpen(false)
      router.replace('/iniciar-sesion')
    } catch (err) {
      toast.error('Error de conexión')
      setCargando(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 p-0"
      >
        <LogOut className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar sesión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cerrar tu sesión?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={cargando}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={cargando}
            >
              {cargando ? 'Cerrando...' : 'Cerrar sesión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
