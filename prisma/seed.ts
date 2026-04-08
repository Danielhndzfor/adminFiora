import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed de datos iniciales para la base de datos
 * Ejecutar: npx ts-node prisma/seed.ts
 */
async function main() {
  console.log('Iniciando seed de datos...')

  // Catálogo de Roles
  const roles = await Promise.all([
    prisma.rolCatalogo.upsert({
      where: { nombre: 'ADMINISTRADOR' },
      update: {},
      create: {
        nombre: 'ADMINISTRADOR',
        descripcion: 'Acceso total al sistema',
        permisos: JSON.stringify(['usuarios', 'productos', 'órdenes', 'reportes']),
      },
    }),
    prisma.rolCatalogo.upsert({
      where: { nombre: 'VENDEDOR' },
      update: {},
      create: {
        nombre: 'VENDEDOR',
        descripcion: 'Gestión de productos y órdenes',
        permisos: JSON.stringify(['productos', 'órdenes']),
      },
    }),
    prisma.rolCatalogo.upsert({
      where: { nombre: 'CLIENTE' },
      update: {},
      create: {
        nombre: 'CLIENTE',
        descripcion: 'Cliente regular de la tienda',
        permisos: JSON.stringify(['ver_productos', 'comprar']),
      },
    }),
  ])

  console.log(`✓ ${roles.length} roles creados`)

  // Catálogo de Categorías
  const categorias = await Promise.all([
    prisma.categoriaCatalogo.upsert({
      where: { nombre: 'Electrónica' },
      update: {},
      create: {
        nombre: 'Electrónica',
        descripcion: 'Productos electrónicos variados',
      },
    }),
    prisma.categoriaCatalogo.upsert({
      where: { nombre: 'Ropa' },
      update: {},
      create: {
        nombre: 'Ropa',
        descripcion: 'Prendas de vestir',
      },
    }),
    prisma.categoriaCatalogo.upsert({
      where: { nombre: 'Hogar' },
      update: {},
      create: {
        nombre: 'Hogar',
        descripcion: 'Artículos para el hogar',
      },
    }),
  ])

  console.log(`✓ ${categorias.length} categorías creadas`)

  // Catálogo de Métodos de Pago
  const metodosPago = await Promise.all([
    prisma.metodoPagoCatalogo.upsert({
      where: { nombre: 'Tarjeta de Crédito' },
      update: {},
      create: {
        nombre: 'Tarjeta de Crédito',
        descripcion: 'Visa, Mastercard, American Express',
      },
    }),
    prisma.metodoPagoCatalogo.upsert({
      where: { nombre: 'Tarjeta de Débito' },
      update: {},
      create: {
        nombre: 'Tarjeta de Débito',
        descripcion: 'Tarjetas de débito bancarias',
      },
    }),
    prisma.metodoPagoCatalogo.upsert({
      where: { nombre: 'Transferencia Bancaria' },
      update: {},
      create: {
        nombre: 'Transferencia Bancaria',
        descripcion: 'Transferencia directa a cuenta',
      },
    }),
    prisma.metodoPagoCatalogo.upsert({
      where: { nombre: 'PayPal' },
      update: {},
      create: {
        nombre: 'PayPal',
        descripcion: 'Pago a través de PayPal',
      },
    }),
  ])

  console.log(`✓ ${metodosPago.length} métodos de pago creados`)

  // Catálogo de Estatus de Órdenes
  const estatus = await Promise.all([
    prisma.estatusCatalogo.upsert({
      where: { nombre: 'PAGADO' },
      update: {},
      create: {
        nombre: 'PAGADO',
        descripcion: 'Orden pagada y confirmada',
      },
    }),
    prisma.estatusCatalogo.upsert({
      where: { nombre: 'PENDIENTE' },
      update: {},
      create: {
        nombre: 'PENDIENTE',
        descripcion: 'Orden pendiente de pago',
      },
    }),
    prisma.estatusCatalogo.upsert({
      where: { nombre: 'CANCELADO' },
      update: {},
      create: {
        nombre: 'CANCELADO',
        descripcion: 'Orden cancelada',
      },
    }),
  ])

  console.log(`✓ ${estatus.length} estatus de órdenes creados`)

  console.log('✓ Seed completado exitosamente')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
