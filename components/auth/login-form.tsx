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

export default function IniciarSesion() {
    const router = useRouter()
    const { toast } = useToast()
    const [cargando, setCargando] = useState(false)
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogTitle, setDialogTitle] = useState('')
    const [dialogMessage, setDialogMessage] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setCargando(true)

        try {
            const res = await fetch('/api/autenticacion/iniciar-sesion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena }),
            })

            const data = await res.json()

            if (!res.ok) {
                const message = data?.error || 'Error al iniciar sesión'
                const code = data?.code ? ` (Código: ${data.code})` : ''
                const full = message + code
                toast.error(full)
                setDialogTitle('Error al iniciar sesión')
                setDialogMessage(full)
                setDialogOpen(true)
                return
            }

            // No guardar token en localStorage por seguridad — se usan cookies httpOnly.
            localStorage.setItem('usuario', JSON.stringify(data.usuario))

            toast.success('Sesión iniciada correctamente')
            setDialogTitle('Sesión iniciada')
            setDialogMessage('Has iniciado sesión correctamente.')
            setDialogOpen(true)
            // redirigir tras cerrar el diálogo o inmediatamente si prefieres
            // router.push('/dashboard')
        } catch (err: any) {
            const code = err?.code ? ` (Código: ${err.code})` : ''
            const full = 'Error de conexión' + code
            toast.error(full)
            setDialogTitle('Error de conexión')
            setDialogMessage(full)
            setDialogOpen(true)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
            style={{ backgroundColor: '#092b2b' }}
        >
            {/* Logo */}
            <div className="mb-2 flex flex-col items-center gap-3">
                <Image
                    src="/logoFioraFVerde.png"
                    alt="FIORA"
                    width={300}
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
                    Iniciar Sesión
                </h1>
                <p className="text-sm mb-6" style={{ color: 'rgba(254,255,255,0.5)' }}>
                    Accede a tu cuenta FIORA
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#bfa274' }}>
                            Correo
                        </label>
                        <Input
                            type="email"
                            placeholder="tu@correo.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                            className="h-11"
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
                            placeholder="••••••••"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            required
                            className="h-11"
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
                        className="w-full h-11 font-semibold mt-2 transition-opacity hover:opacity-90 active:opacity-80"
                        style={{ backgroundColor: '#bfa274', color: '#092b2b' }}
                    >
                        {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
                    </Button>
                </form>

                {/* <div className="mt-5 space-y-2 text-center text-sm">
                    <a
                        href="/olvide-contrasena"
                        className="block transition-opacity hover:opacity-80"
                        style={{ color: 'rgba(191,162,116,0.7)' }}
                    >
                        ¿Olvidaste tu contraseña?
                    </a>
                    <p style={{ color: 'rgba(254,255,255,0.4)' }}>
                        ¿No tienes cuenta?{' '}
                        <a
                            href="/registro"
                            className="font-semibold transition-opacity hover:opacity-80"
                            style={{ color: '#bfa274' }}
                        >
                            Regístrate
                        </a>
                    </p>
                </div> */}
            </div>

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

            {/* Footer */}
            <p className="mt-8 text-xs" style={{ color: 'rgba(254,255,255,0.2)' }}>
                © 2026 FIORA · Todos los derechos reservados
            </p>


        </div>


    )
}
