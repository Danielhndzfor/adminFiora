import prisma from './prisma'

/**
 * Genera el siguiente código de producto en secuencia
 * Formato: F00001, F00002, F00003, etc.
 */
export async function generarCodigoProducto(): Promise<string> {
  const ultimoProducto = await prisma.producto.findFirst({
    orderBy: {
      id: 'desc',
    },
    select: {
      codigo: true,
    },
  })

  if (!ultimoProducto) {
    return 'F00001'
  }

  // Extraer el número del código (ej: "F00001" -> 1)
  const numeroActual = parseInt(ultimoProducto.codigo.replace('F', ''), 10)
  const siguienteNumero = numeroActual + 1

  // Formatear a 5 dígitos
  return `F${String(siguienteNumero).padStart(5, '0')}`
}
