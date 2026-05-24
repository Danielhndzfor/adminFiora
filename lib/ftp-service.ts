import FTP from 'ftp'
import path from 'path'

const ftpConfig = {
    host: process.env.FTP_HOST!,
    port: parseInt(process.env.FTP_PORT || '21'),
    user: process.env.FTP_USER!,
    password: process.env.FTP_PASSWORD!,
}

const REMOTE_BASE = process.env.FTP_REMOTE_PATH || '/fiora.mascontrol.app/uploads/products'
const BASE_URL = process.env.FTP_BASE_URL || 'https://fiora.mascontrol.app/uploads/products'

/**
 * Sube un archivo al VPS via FTP.
 */
export async function uploadToFTP(remotePath: string, buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const client = new FTP()

        client.on('ready', async () => {
            try {
                // Asegurar que exista el subdirectorio del producto
                const dir = path.posix.join(REMOTE_BASE, path.posix.dirname(remotePath))
                const filename = path.posix.basename(remotePath)
                const fullRemotePath = path.posix.join(dir, filename)

                // Crear directorio si no existe (mkdir con true = mkdirp)
                client.mkdir(dir, true, (mkdirErr) => {
                    if (mkdirErr) {
                        client.end()
                        return reject(new Error(`Error creando directorio FTP: ${mkdirErr.message}`))
                    }

                    const readable = require('stream').Readable.from(buffer)

                    client.put(readable, fullRemotePath, (putErr) => {
                        client.end()
                        if (putErr) {
                            return reject(new Error(`Error subiendo archivo FTP: ${putErr.message}`))
                        }
                        resolve(`${BASE_URL}/${remotePath}`)
                    })
                })
            } catch (err) {
                client.end()
                reject(err)
            }
        })

        client.on('error', (err) => {
            reject(new Error(`Error de conexión FTP: ${err.message}`))
        })

        client.connect(ftpConfig)
    })
}

/**
 * Prueba la conectividad FTP sin subir nada.
 */
export async function pingFTP(): Promise<{ ok: boolean; host: string; ms: number; error?: string }> {
    const start = Date.now()
    return new Promise((resolve) => {
        const client = new FTP()
        let settled = false

        const done = (result: { ok: boolean; host: string; ms: number; error?: string }) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            resolve(result)
        }

        const timer = setTimeout(() => {
            client.destroy()
            done({ ok: false, host: ftpConfig.host, ms: Date.now() - start, error: 'Timeout (8s)' })
        }, 8000)

        client.on('ready', () => {
            client.end()
            done({ ok: true, host: ftpConfig.host, ms: Date.now() - start })
        })

        client.on('error', (err) => {
            done({ ok: false, host: ftpConfig.host, ms: Date.now() - start, error: err.message })
        })

        client.connect(ftpConfig)
    })
}

/**
 * Elimina un archivo del VPS via FTP.
 */
export async function deleteFromFTP(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const client = new FTP()

        client.on('ready', () => {
            const fullPath = path.posix.join(REMOTE_BASE, remotePath)
            client.delete(fullPath, (err) => {
                client.end()
                if (err) {
                    // Si no existe el archivo, no es un error crítico
                    console.warn(`FTP delete warning (${fullPath}):`, err.message)
                    resolve()
                } else {
                    resolve()
                }
            })
        })

        client.on('error', (err) => {
            reject(new Error(`Error de conexión FTP: ${err.message}`))
        })

        client.connect(ftpConfig)
    })
}
