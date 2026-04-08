import prisma from './prisma'

/**
 * Genera el siguiente número de ticket/orden
 * Formato: TKT-2026-0001, TKT-2026-0002, etc.
 */
export async function generarNumeroTicket(): Promise<string> {
  const anio = new Date().getFullYear()

  // Buscar el último ticket del año actual
  const ultimoTicket = await prisma.orden.findFirst({
    where: {
      numeroTicket: {
        startsWith: `TKT-${anio}-`,
      },
    },
    orderBy: {
      creadoEn: 'desc',
    },
    select: {
      numeroTicket: true,
    },
  })

  if (!ultimoTicket) {
    return `TKT-${anio}-0001`
  }

  // Extraer el número secuencial
  const partes = ultimoTicket.numeroTicket.split('-')
  const numeroActual = parseInt(partes[2], 10)
  const siguienteNumero = numeroActual + 1

  return `TKT-${anio}-${String(siguienteNumero).padStart(4, '0')}`
}
