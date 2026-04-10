'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Trash2, Edit2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { clearCategoriasCache } from '@/lib/categories'

interface CatalogItem {
  id: number
  nombre: string
  descripcion?: string
  activo: boolean
  [key: string]: any
}

interface CatalogType {
  name: string
  label: string
  endpoint: string
}

const catalogs: CatalogType[] = [
  { name: 'roles', label: 'Roles', endpoint: '/api/catalogos/roles' },
  { name: 'categorias', label: 'Categorías', endpoint: '/api/catalogos/categorias' },
  { name: 'metodos', label: 'Métodos de Pago', endpoint: '/api/catalogos/metodos-pago' },
  { name: 'estatus', label: 'Estatus', endpoint: '/api/catalogos/estatus' },
]

interface FormData {
  nombre: string
  descripcion: string
  imagen?: string
  permisos?: string
}

export function AdminContent() {
  const [activeTab, setActiveTab] = useState('roles')
  const [items, setItems] = useState<Record<string, CatalogItem[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [formData, setFormData] = useState<FormData>({ nombre: '', descripcion: '' })

  // Initialize items for all catalogs
  useEffect(() => {
    catalogs.forEach((catalog) => {
      if (!items[catalog.name]) {
        setItems((prev) => ({ ...prev, [catalog.name]: [] }))
      }
      fetchItems(catalog.name)
    })
  }, [])

  async function fetchItems(catalogName: string) {
    const catalog = catalogs.find((c) => c.name === catalogName)
    if (!catalog) return

    setLoading((prev) => ({ ...prev, [catalogName]: true }))
    try {
      const res = await fetch(catalog.endpoint)
      if (!res.ok) throw new Error('Error fetching items')
      const data = await res.json()
      setItems((prev) => ({ ...prev, [catalogName]: data.data }))
    } catch (error) {
      console.error(`Error fetching ${catalogName}:`, error)
      toast.error(`Error al cargar ${catalog.label}`)
    } finally {
      setLoading((prev) => ({ ...prev, [catalogName]: false }))
    }
  }

  function openAddDialog() {
    setEditingItem(null)
    setFormData({ nombre: '', descripcion: '' })
    setDialogOpen(true)
  }

  function openEditDialog(item: CatalogItem) {
    setEditingItem(item)
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      imagen: item.imagen,
      permisos: item.permisos,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    const catalog = catalogs.find((c) => c.name === activeTab)
    if (!catalog) return

    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      const method = editingItem ? 'PUT' : 'POST'
      const body = {
        ...formData,
        ...(editingItem && { id: editingItem.id }),
      }

      const res = await fetch(catalog.endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error saving item')
      }

      toast.success(editingItem ? 'Actualizado exitosamente' : 'Creado exitosamente')
      
      // Limpiar caché de categorías si se actualiza/crea categoría
      if (activeTab === 'categorias') {
        clearCategoriasCache()
      }
      
      await fetchItems(activeTab)
      setDialogOpen(false)
      setFormData({ nombre: '', descripcion: '' })
    } catch (error: any) {
      console.error('Error saving:', error)
      toast.error(error.message || 'Error al guardar')
    }
  }

  async function handleToggleActivo(item: CatalogItem) {
    const catalog = catalogs.find((c) => c.name === activeTab)
    if (!catalog) return

    try {
      const res = await fetch(catalog.endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, nombre: item.nombre, activo: !item.activo }),
      })

      if (!res.ok) {
        const error = await res.json()
        // Si hay productos activos con esta categoría, mostrar mensaje específico
        if (error.code === 'ACTIVE_PRODUCTS') {
          toast.error(`❌ ${error.error}`)
          return
        }
        throw new Error(error.error || 'Error')
      }

      toast.success(!item.activo ? 'Activado' : 'Desactivado')
      
      // Limpiar caché de categorías si se cambia estado
      if (activeTab === 'categorias') {
        clearCategoriasCache()
      }
      
      await fetchItems(activeTab)
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado')
    }
  }

  async function handleDelete(item: CatalogItem) {
    const catalog = catalogs.find((c) => c.name === activeTab)
    if (!catalog) return

    if (!confirm(`¿Estás seguro de eliminar "${item.nombre}"?`)) return

    try {
      const res = await fetch(`${catalog.endpoint}?id=${item.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error deleting item')
      }

      toast.success('Eliminado exitosamente')
      await fetchItems(activeTab)
    } catch (error: any) {
      console.error('Error deleting:', error)
      toast.error(error.message || 'Error al eliminar')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {catalogs.map((catalog) => (
            <TabsTrigger key={catalog.name} value={catalog.name}>
              {catalog.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {catalogs.map((catalog) => (
          <TabsContent key={catalog.name} value={catalog.name}>
            <div className="space-y-4">
              {/* Add Button */}
              <div className="flex justify-end">
                <Button size="sm" onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo
                </Button>
              </div>

              {/* Items List */}
              {loading[catalog.name] ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : items[catalog.name]?.length > 0 ? (
                <div className="space-y-2">
                  {items[catalog.name].map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.nombre}</p>
                          {item.descripcion && (
                            <p className="text-sm text-muted-foreground truncate">{item.descripcion}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {item.activo !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded ${item.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {item.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            title={item.activo ? 'Desactivar' : 'Activar'}
                            onClick={(e) => { e.stopPropagation(); handleToggleActivo(item) }}
                          >
                            {item.activo
                              ? <ToggleRight className="h-4 w-4 text-green-600" />
                              : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(item) }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay items
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Nuevo'} {catalogs.find((c) => c.name === activeTab)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                placeholder="Descripción (opcional)"
                value={formData.descripcion}
                onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

