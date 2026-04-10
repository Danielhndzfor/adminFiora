'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

export default function RegistroForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [cargando, setCargando] = useState(false)
  const [mostrarErrores, setMostrarErrores] = useState(false)
  const [erroresContrasena, setErroresContrasena] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogMessage, setDialogMessage] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    confirmacion: '',
    telefono: '',
  })

  function validarContrasena(contrasena: string) {
    const errores: string[] = []
    if (contrasena.length < 8) errores.push('Mínimo 8 caracteres')
    if (!/[A-Z]/.test(contrasena)) errores.push('Debe incluir mayúsculas')
    if (!/[0-9]/.test(contrasena)) errores.push('Debe incluir números')
    if (!/[!@#$%^&*]/.test(contrasena)) errores.push('Debe incluir especiales (!@#$%^&*)')
    return errores
  }

  function handleChangeContrasena(value: string) {
    setForm({ ...form, contrasena: value })
    setErroresContrasena(validarContrasena(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.contrasena !== form.confirmacion) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (erroresContrasena.length > 0) {
      setMostrarErrores(true)
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/autenticacion/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo,
          contrasena: form.contrasena,
          telefono: form.telefono || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const message = data?.error || 'Error en registro'
        const code = data?.code ? ` (Código: ${data.code})` : ''
        const full = message + code
        toast.error(full)
        setDialogTitle('Error en registro')
        setDialogMessage(full)
        setDialogOpen(true)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))

      toast.success('Cuenta creada correctamente')
      setDialogTitle('Registro exitoso')
      setDialogMessage('Tu cuenta fue creada correctamente.')
      setDialogOpen(true)
      // router.push('/dashboard') // navegamos tras aceptar en el modal
    } catch (err) {
      toast.error('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#092b2b' }}
    >
      {/* Logo */}
      <div className="mb-7 flex flex-col items-center gap-3">
        <Image
          src="/logoFioraFVerde.png"
          alt="FIORA"
          width={280}
          height={72}
          className="object-contain"
          priority
        />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-7 shadow-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(191,162,116,0.25)' }}
      >
        <h1 className="text-xl font-semibold mb-1" style={{ color: '#feffff' }}>
          Crear Cuenta
        </h1>
        <p className="text-sm mb-5" style={{ color: 'rgba(254,255,255,0.5)' }}>
          Únete a FIORA hoy
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#bfa274' }}>
                Nombre
              </label>
              <Input
                placeholder="Juan"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                className="h-10"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderColor: 'rgba(191,162,116,0.3)',
                  color: '#feffff',
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#bfa274' }}>
                Apellido
              </label>
              <Input
                placeholder="Pérez"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                required
                className="h-10"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderColor: 'rgba(191,162,116,0.3)',
                  color: '#feffff',
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#bfa274' }}>
              Correo
            </label>
            <Input
              type="email"
              placeholder="tu@correo.com"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              required
              className="h-10"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(191,162,116,0.3)',
                color: '#feffff',
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#bfa274' }}>
              Teléfono <span style={{ color: 'rgba(191,162,116,0.5)' }}>(opcional)</span>
            </label>
            <Input
              type="tel"
              placeholder="+1234567890"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="h-10"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(191,162,116,0.3)',
                color: '#feffff',
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#bfa274' }}>
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="Mín 8 caracteres"
              value={form.contrasena}
              onChange={(e) => handleChangeContrasena(e.target.value)}
              required
              className="h-10"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(191,162,116,0.3)',
                color: '#feffff',
              }}
            />
            {mostrarErrores && erroresContrasena.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {erroresContrasena.map((err) => (
                  <p key={err} className="text-xs" style={{ color: '#f87171' }}>
                    • {err}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#bfa274' }}>
              Confirmar Contraseña
            </label>
            <Input
              type="password"
              placeholder="Repite tu contraseña"
              value={form.confirmacion}
              onChange={(e) => setForm({ ...form, confirmacion: e.target.value })}
              required
              className="h-10"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(191,162,116,0.3)',
                color: '#feffff',
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={cargando}
            className="w-full h-11 font-semibold mt-1 transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: '#bfa274', color: '#092b2b' }}
          >
            {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: 'rgba(254,255,255,0.4)' }}>
          ¿Ya tienes cuenta?{' '}
          <a
            href="/iniciar-sesion"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: '#bfa274' }}
          >
            Inicia sesión
          </a>
        </p>
      </div>

      <p className="mt-8 text-xs" style={{ color: 'rgba(254,255,255,0.2)' }}>
        © 2026 FIORA · Todos los derechos reservados
      </p>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogMessage}</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => router.push('/dashboard')}>Aceptar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
