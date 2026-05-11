/**
 * Endpoint de prueba: Validar conectividad FTP + Cloudinary
 * GET /api/test-connection
 */

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FTP from 'ftp'
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const FTP_CONFIG = {
  host: process.env.FTP_HOST || '198.251.78.127',
  user: process.env.FTP_USER || 'sad-diffie_u3flty379x',
  password: process.env.FTP_PASSWORD || 'pPT2gFp7drm2i~g@',
  port: parseInt(process.env.FTP_PORT || '21'),
}

const REMOTE_PATH = process.env.FTP_REMOTE_PATH || '/httpdocs/fioraImages'
const FTP_BASE_URL = process.env.FTP_BASE_URL || 'https://sad-diffie.198-251-78-127.plesk.page/fioraImages'
const TEST_FILE = 'test-fiora-migration.txt'

interface TestResult {
  name: string
  passed: boolean
  message: string
  error?: string
}

async function connectFTP(): Promise<FTP> {
  return new Promise((resolve, reject) => {
    const ftp = new FTP()
    ftp.on('ready', () => resolve(ftp))
    ftp.on('error', reject)
    ftp.connect(FTP_CONFIG)
  })
}

export async function GET() {
  const results: TestResult[] = []

  try {
    // Test 1: Variables de entorno
    const envOk =
      !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET &&
      !!process.env.FTP_HOST &&
      !!process.env.FTP_PORT &&
      !!process.env.FTP_USER &&
      !!process.env.FTP_PASSWORD &&
      !!process.env.FTP_REMOTE_PATH &&
      !!process.env.FTP_BASE_URL

    results.push({
      name: 'Variables de Entorno',
      passed: envOk,
      message: envOk ? 'Todas las claves están presentes (Cloudinary + FTP)' : 'Faltan variables',
    })

    // Test 2: Conectar FTP
    let ftpConnected = false

    try {
      const ftp = await connectFTP()
      ftpConnected = true
      ftp.end()
      results.push({
        name: 'Conexión FTP',
        passed: true,
        message: `Conectado a ${FTP_CONFIG.host}:${FTP_CONFIG.port} exitosamente`,
      })
    } catch (error) {
      results.push({
        name: 'Conexión FTP',
        passed: false,
        message: 'No se pudo conectar',
        error: String(error),
      })
    }

    // Test 3: Directorio remoto  
    if (ftpConnected) {
      try {
        const ftp = await connectFTP()

        await new Promise<void>((resolve, reject) => {
          ftp.list(REMOTE_PATH, (err) => {
            ftp.end()
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })

        results.push({
          name: 'Directorio Remoto',
          passed: true,
          message: `${REMOTE_PATH} existe y es accesible`,
        })
      } catch (error) {
        results.push({
          name: 'Directorio Remoto',
          passed: false,
          message: 'Error al verificar directorio',
          error: String(error),
        })
      }
    }

    // Test 4: Subir/descargar/eliminar
    if (ftpConnected) {
      try {
        const ftp = await connectFTP()
        const testContent = `Test - ${new Date().toISOString()}`
        const tmpDir = path.join('/tmp', 'fiora-test')

        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true })
        }

        const tmpFile = path.join(tmpDir, TEST_FILE)
        fs.writeFileSync(tmpFile, testContent)
        const remoteFile = `${REMOTE_PATH}/${TEST_FILE}`
        const downloadFile = path.join(tmpDir, `downloaded_${TEST_FILE}`)

        let verified = false

        await new Promise<void>((resolve, reject) => {
          // Upload
          ftp.put(tmpFile, remoteFile, (uploadErr) => {
            if (uploadErr) {
              ftp.end()
              reject(uploadErr)
            } else {
              // Download
              ftp.get(remoteFile, (downloadErr, stream) => {
                if (downloadErr) {
                  ftp.end()
                  reject(downloadErr)
                } else {
                  const writeStream = fs.createWriteStream(downloadFile)
                  stream.pipe(writeStream)

                  writeStream.on('finish', () => {
                    const downloaded = fs.readFileSync(downloadFile, 'utf-8')
                    verified = downloaded === testContent

                    // Delete
                    ftp.delete(remoteFile, (deleteErr) => {
                      // Cleanup
                      try {
                        fs.unlinkSync(tmpFile)
                        fs.unlinkSync(downloadFile)
                      } catch {}

                      ftp.end()
                      if (deleteErr) {
                        reject(deleteErr)
                      } else {
                        resolve()
                      }
                    })
                  })

                  writeStream.on('error', (err) => {
                    ftp.end()
                    reject(err)
                  })
                }
              })
            }
          })
        })

        results.push({
          name: 'Subir/Descargar/Eliminar',
          passed: verified,
          message: verified ? 'Ciclo completo exitoso' : 'Contenido no coincide',
        })
      } catch (error) {
        results.push({
          name: 'Subir/Descargar/Eliminar',
          passed: false,
          message: 'Error en ciclo de archivos',
          error: String(error),
        })
      }
    }

    // Test 5: Cloudinary - Listar
    try {
      const cloudinaryResult = await cloudinary.api.resources({
        type: 'upload',
        max_results: 1,
      })

      results.push({
        name: 'Cloudinary API',
        passed: true,
        message: `Conectado. Total de imágenes: ${cloudinaryResult.total_count || 0}`,
      })

      // Test 6: Descargar imagen Cloudinary
      if (cloudinaryResult.resources && cloudinaryResult.resources.length > 0) {
        try {
          const imageUrl = cloudinaryResult.resources[0].secure_url
          const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
          })

          const sizeMB = (response.data.length / (1024 * 1024)).toFixed(2)
          results.push({
            name: 'Descargar Imagen Cloudinary',
            passed: true,
            message: `Imagen descargada: ${sizeMB} MB`,
          })
        } catch (error) {
          results.push({
            name: 'Descargar Imagen Cloudinary',
            passed: false,
            message: 'Error descargando imagen',
            error: String(error),
          })
        }
      } else {
        results.push({
          name: 'Descargar Imagen Cloudinary',
          passed: true,
          message: 'Skipped: No hay imágenes en Cloudinary',
        })
      }
    } catch (error) {
      results.push({
        name: 'Cloudinary API',
        passed: false,
        message: 'No se pudo conectar a Cloudinary',
        error: String(error),
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error durante pruebas',
        details: String(error),
      },
      { status: 500 }
    )
  }

  const passed = results.filter(r => r.passed).length
  const total = results.length

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary: {
      passed,
      total,
      ready: passed === total,
    },
    results,
    recommendation:
      passed === total
        ? 'Sistema listo para migración. Ejecuta: npx ts-node prisma/migrate-images.ts --dry-run'
        : 'Revisa los errores antes de intentar la migración.',
  })
}
