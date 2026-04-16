'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Trash2, Edit2, Plus, ToggleLeft, ToggleRight, Settings, Layers, Users, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { clearCategoriasCache } from '@/lib/categories'
import { PWASettings } from '@/components/pwa-settings'

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
  const [search, setSearch] = useState('')

  // Initialize items for all catalogs
  useEffect(() => {
    catalogs.forEach((catalog) => {
      if (!items[catalog.name]) {
        setItems((prev) => ({ ...prev, [catalog.name]: [] }))
      }
      fetchItems(catalog.name)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setFormData({ nombre: item.nombre, descripcion: item.descripcion || '', imagen: item.imagen, permisos: item.permisos })
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
      if (activeTab === 'categorias') clearCategoriasCache()
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
        if (error.code === 'ACTIVE_PRODUCTS') {
          toast.error(`❌ ${error.error}`)
          return
        }
        throw new Error(error.error || 'Error')
      }

      toast.success(!item.activo ? 'Activado' : 'Desactivado')
      if (activeTab === 'categorias') clearCategoriasCache()
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
      if (!res.ok) throw new Error()
      toast.success('Eliminado')
      await fetchItems(activeTab)
    } catch {
      toast.error('Error eliminando item')
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full sm:w-64">
          <div className="sticky top-4 space-y-3">
            <div className="px-2 py-3 rounded-lg bg-white/60 border border-[#092B2B]/6">
              <h4 className="text-xs font-semibold text-[#092B2B]">Secciones</h4>
            </div>

            <nav className="flex flex-col gap-2">
              <button className={`flex items-center gap-3 p-3 rounded-lg text-sm w-full text-left ${activeTab === 'roles' ? 'bg-[#092B2B] text-white' : 'bg-white border border-[#092B2B]/8'}`} onClick={() => setActiveTab('roles')}>
                <Users className="h-4 w-4" />
                Roles
              </button>

              <button className={`flex items-center gap-3 p-3 rounded-lg text-sm w-full text-left ${activeTab === 'categorias' ? 'bg-[#092B2B] text-white' : 'bg-white border border-[#092B2B]/8'}`} onClick={() => setActiveTab('categorias')}>
                <Tag className="h-4 w-4" />
                Categorías
              </button>

              <button className={`flex items-center gap-3 p-3 rounded-lg text-sm w-full text-left ${activeTab === 'metodos' ? 'bg-[#092B2B] text-white' : 'bg-white border border-[#092B2B]/8'}`} onClick={() => setActiveTab('metodos')}>
                <Layers className="h-4 w-4" />
                Métodos de Pago
              </button>

              <button className={`flex items-center gap-3 p-3 rounded-lg text-sm w-full text-left ${activeTab === 'estatus' ? 'bg-[#092B2B] text-white' : 'bg-white border border-[#092B2B]/8'}`} onClick={() => setActiveTab('estatus')}>
                <Settings className="h-4 w-4" />
                Estatus
              </button>
            </nav>

            {/* Main */}
        <section className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#092B2B]">{catalogs.find(c => c.name === activeTab)?.label}</h3>
              <p className="text-sm text-[#092B2B]/60">Administra los elementos de la sección seleccionada</p>
            </div>

            <div className="flex items-center gap-2">
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
              <Button size="sm" onClick={openAddDialog} className="inline-flex items-center gap-2 bg-[#092B2B] text-white">
                <Plus className="h-4 w-4" /> Nuevo
              </Button>
            </div>
          </div>

          {/* List area */}
          <div className="grid grid-cols-1 gap-3">
            {loading[activeTab] ? (
              <div className="p-6 bg-white rounded-lg border flex items-center justify-center">Cargando...</div>
            ) : items[activeTab]?.length > 0 ? (
              items[activeTab]
                .filter(it => it.nombre.toLowerCase().includes(search.trim().toLowerCase()))
                .map(item => (
                  <Card key={item.id} className="p-3">
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.nombre}</p>
                        {item.descripcion && <p className="text-xs text-[#092B2B]/60 mt-1">{item.descripcion}</p>}
                        <div className="mt-2">
                          <span className={`inline-flex items-center text-xs px-2 py-1 rounded ${item.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleToggleActivo(item)} title={item.activo ? 'Desactivar' : 'Activar'}>
                          {item.activo ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="p-6 bg-white rounded-lg border text-center text-[#092B2B]/60">No hay items</div>
            )}
          </div>
        </section>

            <div className="pt-2">
              <div className="px-2 py-3 rounded-lg bg-white/60 border border-[#092B2B]/6">
                <h5 className="text-xs font-medium">Herramientas</h5>
                <p className="text-xs text-[#092B2B]/60 mt-1">Ajustes de PWA y mantenimiento</p>
                <div className="mt-3">
                  <PWASettings />
                </div>
              </div>
            </div>
          </div>
        </aside>

        
      </div>

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

