'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function OlvideContrasenaForm() {
    const { toast } = useToast()
    const [cargando, setCargando] = useState(false)
    const [correo, setCorreo] = useState('')
    const [enviado, setEnviado] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setCargando(true)

        try {
            const res = await fetch('/api/autenticacion/olvide-contrasena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Error en la solicitud')
                return
            }

            setEnviado(true)
            toast.success('Si existe una cuenta con ese correo, recibirás un enlace de restablecimiento')
        } catch (err) {
            toast.error('Error de conexión')
        } finally {
            setCargando(false)
        }
    }

    const logoBlock = (
        <div className="mb-8 flex flex-col items-center gap-3">
            <Image
                src="/logoFioraFVerde.png"
                alt="FIORA"
                width={180}
                height={65}
                className="object-contain"
                priority
            />
            <p className="text-sm tracking-[0.25em] uppercase" style={{ color: '#bfa274' }}>
                Sistema de Joyería
            </p>
        </div>
    )

    if (enviado) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
                style={{ backgroundColor: '#092b2b' }}
            >
                {logoBlock}
                <div
                    className="w-full max-w-sm rounded-2xl p-7 shadow-2xl text-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(191,162,116,0.25)' }}
                >
                    <div
                        className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                        style={{ backgroundColor: 'rgba(191,162,116,0.15)' }}
                    >
                        ✉️
                    </div>
                    <h2 className="text-xl font-semibold mb-2" style={{ color: '#feffff' }}>
                        Correo Enviado
                    </h2>
                    <p className="text-sm mb-6" style={{ color: 'rgba(254,255,255,0.5)' }}>
                        Si existe una cuenta con <span style={{ color: '#bfa274' }}>{correo}</span>, recibirás instrucciones en los próximos minutos.
                    </p>
                    <a
                        href="/iniciar-sesion"
                        className="inline-block text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ color: '#bfa274' }}
                    >
                        ← Volver a iniciar sesión
                    </a>
                </div>
                <p className="mt-8 text-xs" style={{ color: 'rgba(254,255,255,0.2)' }}>
                    © 2026 FIORA · Todos los derechos reservados
                </p>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
            style={{ backgroundColor: '#092b2b' }}
        >
            {logoBlock}

            <div
                className="w-full max-w-sm rounded-2xl p-7 shadow-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(191,162,116,0.25)' }}
            >
                <h1 className="text-xl font-semibold mb-1" style={{ color: '#feffff' }}>
                    Recuperar Contraseña
                </h1>
                <p className="text-sm mb-6" style={{ color: 'rgba(254,255,255,0.5)' }}>
                    Ingresa tu correo y te enviaremos un enlace
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

                    <Button
                        type="submit"
                        disabled={cargando}
                        className="w-full h-11 font-semibold transition-opacity hover:opacity-90 active:opacity-80"
                        style={{ backgroundColor: '#bfa274', color: '#092b2b' }}
                    >
                        {cargando ? 'Enviando...' : 'Enviar Enlace'}
                    </Button>
                </form>

                <div className="mt-5 text-center">
                    <a
                        href="/iniciar-sesion"
                        className="text-sm transition-opacity hover:opacity-80"
                        style={{ color: 'rgba(191,162,116,0.7)' }}
                    >
                        ← Volver a iniciar sesión
                    </a>
                </div>
            </div>

            <p className="mt-8 text-xs" style={{ color: 'rgba(254,255,255,0.2)' }}>
                © 2026 FIORA · Todos los derechos reservados
            </p>
        </div>
    )
}

