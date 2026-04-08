type Category = { id: number; nombre: string }

let cached: Category[] | null = null
let lastFetch = 0

export async function fetchCategorias(force = false): Promise<Category[]> {
  if (cached && !force) return cached
  try {
    const res = await fetch('/api/categories')
    if (!res.ok) throw new Error('Error cargando categorías')
    const data = await res.json()
    cached = data
    lastFetch = Date.now()
    return data
  } catch (err) {
    throw err
  }
}

export function clearCategoriasCache() {
  cached = null
}
