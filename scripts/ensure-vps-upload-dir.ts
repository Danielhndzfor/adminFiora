/**
 * Script para asegurar que existe la carpeta /uploads/products en el VPS
 * Uso: npx ts-node scripts/ensure-vps-upload-dir.ts
 */

import FTP from 'ftp'
import dotenv from 'dotenv'

dotenv.config()

const ftpConfig = {
    host: process.env.FTP_HOST || 'fiora.mascontrol.app',
    port: parseInt(process.env.FTP_PORT || '21'),
    user: process.env.FTP_USER || '',
    password: process.env.FTP_PASSWORD || '',
}

const REMOTE_PATH = process.env.FTP_REMOTE_PATH || '/fiora.mascontrol.app/uploads/products'

async function ensureUploadDir() {
    return new Promise<void>((resolve, reject) => {
        const client = new FTP()

        client.on('ready', () => {
            console.log(`✓ Conectado a FTP: ${ftpConfig.host}`)
            
            // Intentar crear el directorio (mkdir con recursivo)
            client.mkdir(REMOTE_PATH, true, (err) => {
                if (err) {
                    client.end()
                    console.error(`❌ Error creando directorio: ${err.message}`)
                    return reject(err)
                }
                
                console.log(`✓ Directorio creado/verificado: ${REMOTE_PATH}`)
                
                // Cambiar a ese directorio para verificar que existe
                client.cwd(REMOTE_PATH, (cwdErr) => {
                    if (cwdErr) {
                        client.end()
                        console.error(`❌ Error accediendo a directorio: ${cwdErr.message}`)
                        return reject(cwdErr)
                    }
                    
                    console.log(`✓ Directorio verificado: ${REMOTE_PATH}`)
                    client.end()
                    resolve()
                })
            })
        })

        client.on('error', (err) => {
            console.error(`❌ Error FTP: ${err.message}`)
            reject(err)
        })

        console.log(`Conectando a FTP: ${ftpConfig.host}:${ftpConfig.port}`)
        client.connect(ftpConfig)
    })
}

// Ejecutar
ensureUploadDir()
    .then(() => {
        console.log('\n✓ Configuración completada exitosamente')
        process.exit(0)
    })
    .catch((err) => {
        console.error('\n❌ Error en configuración:', err)
        process.exit(1)
    })
