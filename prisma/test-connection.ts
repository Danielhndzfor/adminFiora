/**
 * Script de Prueba: Validar conectividad FTP + Cloudinary
 * Verificar que se puede leer/escribir en el servidor antes de migración
 * 
 * Uso: npx ts-node prisma/test-connection.ts
 */

import 'dotenv/config'
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

// Configuraciones desde .env
const FTP_CONFIG = {
  host: process.env.FTP_HOST || '198.251.78.127',
  user: process.env.FTP_USER || 'sad-diffie_u3flty379x',
  password: process.env.FTP_PASSWORD || 'pPT2gFp7drm2i~g@',
  port: parseInt(process.env.FTP_PORT || '21'),
}

const REMOTE_PATH = process.env.FTP_REMOTE_PATH || '/httpdocs/fioraImages'
const FTP_BASE_URL = process.env.FTP_BASE_URL || 'https://sad-diffie.198-251-78-127.plesk.page/fioraImages'
const TEST_FILE = 'test-fiora-migration.txt'
const TMP_DIR = path.join(process.cwd(), '.test-tmp')

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`),
}

interface TestResult {
  name: string
  passed: boolean
  details: string
}

const results: TestResult[] = []

// Crear directorio temporal
const ensureTmpDir = () => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true })
  }
}

// Limpiar directorio temporal
const cleanupTmpDir = () => {
  if (fs.existsSync(TMP_DIR)) {
    const files = fs.readdirSync(TMP_DIR)
    files.forEach(file => {
      fs.unlinkSync(path.join(TMP_DIR, file))
    })
    fs.rmdirSync(TMP_DIR)
  }
}

/**
 * Test 1: Validar variables de entorno
 */
const testEnvironmentVariables = () => {
  log.section('1. Variables de Entorno')

  const required = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'DATABASE_URL',
    'FTP_HOST',
    'FTP_PORT',
    'FTP_USER',
    'FTP_PASSWORD',
    'FTP_REMOTE_PATH',
    'FTP_BASE_URL',
  ]

  let allPresent = true
  required.forEach(envVar => {
    if (process.env[envVar]) {
      log.info(`${envVar} = [${process.env[envVar]?.substring(0, 10)}...]`)
    } else {
      log.error(`${envVar} no encontrado`)
      allPresent = false
    }
  })

  results.push({
    name: 'Variables de Entorno',
    passed: allPresent,
    details: allPresent ? 'Todas presentes' : 'Faltan variables',
  })
}

/**
 * Test 2: Conectar a FTP
 */
const testFTPConnection = async () => {
  log.section('2. Conexión FTP')

  const ftp = new FTP()
  let passed = false

  try {
    log.info(`Conectando a ${FTP_CONFIG.host}:${FTP_CONFIG.port}...`)

    await new Promise<void>((resolve, reject) => {
      ftp.on('ready', () => {
        log.success('Conexión FTP establecida')
        resolve()
      })

      ftp.on('error', (err) => {
        reject(err)
      })

      ftp.connect(FTP_CONFIG)
    })

    // Obtener directorio actual
    await new Promise<void>((resolve, reject) => {
      ftp.pwd((err, path) => {
        if (err) reject(err)
        else {
          log.info(`Directorio actual: ${path}`)
          resolve()
        }
      })
    })

    passed = true
    ftp.end()
  } catch (error) {
    log.error(`Error de conexión: ${String(error)}`)
  }

  results.push({
    name: 'Conexión FTP',
    passed,
    details: passed ? 'Conectado exitosamente' : 'Falló',
  })
}

/**
 * Test 3: Verificar directorio remoto
 */
const testRemoteDirectory = async () => {
  log.section('3. Directorio Remoto')

  const ftp = new FTP()
  let passed = false

  try {
    await new Promise<void>((resolve, reject) => {
      ftp.on('ready', () => resolve())
      ftp.on('error', reject)
      ftp.connect(FTP_CONFIG)
    })

    log.info(`Verificando: ${REMOTE_PATH}`)

    try {
      await new Promise<void>((resolve, reject) => {
        ftp.list(REMOTE_PATH, (err) => {
          if (err) reject(err)
          else {
            log.success(`Directorio existe`)
            resolve()
          }
        })
      })
      passed = true
    } catch (error) {
      log.warn(`Directorio no existe, intentando crear...`)
      try {
        await new Promise<void>((resolve, reject) => {
          ftp.mkdir(REMOTE_PATH, true, (err) => {
            if (err) reject(err)
            else {
              log.success(`Directorio creado: ${REMOTE_PATH}`)
              resolve()
            }
          })
        })
        passed = true
      } catch (mkdirError) {
        log.error(`No se puede crear: ${String(mkdirError)}`)
      }
    }

    ftp.end()
  } catch (error) {
    log.error(`Error: ${String(error)}`)
  }

  results.push({
    name: 'Directorio Remoto',
    passed,
    details: passed ? 'Accesible' : 'No accesible',
  })
}

/**
 * Test 4: Subir archivo de prueba
 */
const testUploadFile = async () => {
  log.section('4. Subir Archivo de Prueba')

  const ftp = new FTP()
  let passed = false

  try {
    ensureTmpDir()

    // Crear archivo de prueba
    const testContent = `Prueba de migración - ${new Date().toISOString()}\nSi ves esto, la subida funcionó correctamente.`
    const tmpFile = path.join(TMP_DIR, TEST_FILE)
    fs.writeFileSync(tmpFile, testContent)
    log.info(`Archivo creado localmente: ${TEST_FILE}`)

    // Conectar y subir
    await new Promise<void>((resolve, reject) => {
      ftp.on('ready', () => resolve())
      ftp.on('error', reject)
      ftp.connect(FTP_CONFIG)
    })

    const remoteFile = `${REMOTE_PATH}/${TEST_FILE}`

    await new Promise<void>((resolve, reject) => {
      ftp.put(tmpFile, remoteFile, (err) => {
        if (err) reject(err)
        else {
          log.success(`Archivo subido: ${remoteFile}`)
          resolve()
        }
      })
    })

    passed = true
    ftp.end()
  } catch (error) {
    log.error(`Error al subir: ${String(error)}`)
  }

  results.push({
    name: 'Subir Archivo',
    passed,
    details: passed ? 'Subida exitosa' : 'Falló',
  })
}

/**
 * Test 5: Descargar archivo de prueba
 */
const testDownloadFile = async () => {
  log.section('5. Descargar Archivo de Prueba')

  const ftp = new FTP()
  let passed = false

  try {
    ensureTmpDir()

    await new Promise<void>((resolve, reject) => {
      ftp.on('ready', () => resolve())
      ftp.on('error', reject)
      ftp.connect(FTP_CONFIG)
    })

    const remoteFile = `${REMOTE_PATH}/${TEST_FILE}`
    const tmpFile = path.join(TMP_DIR, `downloaded_${TEST_FILE}`)

    // Descargar
    await new Promise<void>((resolve, reject) => {
      ftp.get(remoteFile, (err, stream) => {
        if (err) {
          reject(err)
        } else {
          stream.pipe(fs.createWriteStream(tmpFile))
          stream.on('end', () => resolve())
          stream.on('error', reject)
        }
      })
    })

    log.success(`Archivo descargado localmente`)

    // Verificar contenido
    const content = fs.readFileSync(tmpFile, 'utf-8')
    log.info(`Contenido: "${content.split('\n')[0]}"`)

    if (content.includes('Prueba de migración')) {
      log.success('Contenido verificado correctamente')
      passed = true
    }

    ftp.end()
  } catch (error) {
    log.error(`Error al descargar: ${String(error)}`)
  }

  results.push({
    name: 'Descargar Archivo',
    passed,
    details: passed ? 'Descarga exitosa' : 'Falló',
  })
}

/**
 * Test 6: Eliminar archivo de prueba
 */
const testDeleteFile = async () => {
  log.section('6. Eliminar Archivo de Prueba')

  const ftp = new FTP()
  let passed = false

  try {
    await new Promise<void>((resolve, reject) => {
      ftp.on('ready', () => resolve())
      ftp.on('error', reject)
      ftp.connect(FTP_CONFIG)
    })

    const remoteFile = `${REMOTE_PATH}/${TEST_FILE}`

    await new Promise<void>((resolve, reject) => {
      ftp.delete(remoteFile, (err) => {
        if (err) reject(err)
        else {
          log.success(`Archivo eliminado: ${remoteFile}`)
          resolve()
        }
      })
    })

    passed = true
    ftp.end()
  } catch (error) {
    log.error(`Error al eliminar: ${String(error)}`)
  }

  results.push({
    name: 'Eliminar Archivo',
    passed,
    details: passed ? 'Eliminado exitosamente' : 'Falló',
  })
}

/**
 * Test 7: Verificar Cloudinary
 */
const testCloudinaryConnection = async () => {
  log.section('7. Cloudinary - Listar Imágenes')

  let passed = false
  let imageCount = 0

  try {
    log.info('Consultando API de Cloudinary...')
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 5,
    })

    imageCount = result.total_count || 0
    log.success(`Conectado a Cloudinary`)
    log.info(`Total de imágenes: ${imageCount}`)
    log.info(`Últimas imágenes (max 5):`)

    if (result.resources && result.resources.length > 0) {
      result.resources.forEach((resource: any, idx: number) => {
        log.info(
          `  ${idx + 1}. ${resource.public_id} (${(resource.bytes / 1024).toFixed(2)} KB)`
        )
      })
    }

    passed = true
  } catch (error) {
    log.error(`Error: ${String(error)}`)
  }

  results.push({
    name: 'Cloudinary Connection',
    passed,
    details: passed ? `${imageCount} imágenes encontradas` : 'Falló',
  })
}

/**
 * Test 8: Probar descarga de imagen Cloudinary
 */
const testDownloadCloudinaryImage = async () => {
  log.section('8. Descargar Imagen Cloudinary')

  let passed = false

  try {
    // Obtener primera imagen
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 1,
    })

    if (!result.resources || result.resources.length === 0) {
      log.warn('No hay imágenes en Cloudinary para probar descarga')
      results.push({
        name: 'Descargar Imagen Cloudinary',
        passed: true,
        details: 'Skipped (sin imágenes)',
      })
      return
    }

    const imageUrl = result.resources[0].secure_url
    log.info(`Descargando: ${imageUrl.substring(0, 80)}...`)

    // Descargar
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    })

    const sizeMB = (response.data.length / (1024 * 1024)).toFixed(2)
    log.success(`Imagen descargada: ${sizeMB} MB`)
    passed = true
  } catch (error) {
    log.error(`Error: ${String(error)}`)
  }

  results.push({
    name: 'Descargar Imagen Cloudinary',
    passed,
    details: passed ? 'Imagen descargada exitosamente' : 'Falló',
  })
}

/**
 * Main
 */
const main = async () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🧪 PRUEBA DE CONECTIVIDAD - MIGRACIÓN CLOUDINARY          ║
║     Validar SFTP + Cloudinary antes de ejecutar migraci\u00f3n   ║
╚════════════════════════════════════════════════════════════════╝
  `)

  try {
    // Test 1: Variables de entorno
    testEnvironmentVariables()

    // Test 2-6: FTP
    await testFTPConnection()
    await testRemoteDirectory()
    await testUploadFile()
    await testDownloadFile()
    await testDeleteFile()

    // Test 7-8: Cloudinary
    await testCloudinaryConnection()
    await testDownloadCloudinaryImage()
  } catch (error) {
    log.error(`Error general: ${String(error)}`)
  } finally {
    cleanupTmpDir()
  }

  // Reporte final
  log.section('REPORTE FINAL')

  const passed = results.filter(r => r.passed).length
  const total = results.length

  console.table(
    results.map(r => ({
      '✓': r.passed ? '✓' : '✗',
      Prueba: r.name,
      Estado: r.passed ? 'PASÓ' : 'FALLÓ',
      Detalles: r.details,
    }))
  )

  console.log(`\n${colors.blue}Resultado: ${passed}/${total} pruebas pasaron${colors.reset}\n`)

  if (passed === total) {
    console.log(
      `${colors.green}✓ LISTO PARA MIGRACIÓN${colors.reset}\n` +
        `Ya puedes ejecutar:\n` +
        `  npx ts-node prisma/migrate-images.ts --dry-run\n` +
        `  npx ts-node prisma/migrate-images.ts --limit 5\n` +
        `  npx ts-node prisma/migrate-images.ts\n`
    )
  } else {
    console.log(
      `${colors.red}✗ FALLOS DETECTADOS${colors.reset}\n` +
        `Revisa los errores arriba antes de intentar la migración.\n` +
        `Contacta al proveedor si hay problemas de conectividad.\n`
    )
    process.exit(1)
  }
}

main()
