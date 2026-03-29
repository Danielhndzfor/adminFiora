'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Users, 
  Store, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  Plus, 
  X,
  Shield,
  User,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { UserRole } from '@/lib/types'

type AdminSection = 'main' | 'users' | 'branches' | 'reports' | 'settings'

export function AdminContent() {
  const [activeSection, setActiveSection] = useState<AdminSection>('main')

  const sections = [
    { id: 'users' as const, icon: Users, label: 'Usuarios', description: 'Gestiona usuarios y permisos' },
    { id: 'branches' as const, icon: Store, label: 'Sucursales', description: 'Administra tus puntos de venta' },
    { id: 'reports' as const, icon: BarChart3, label: 'Reportes', description: 'Ventas y estadisticas' },
    { id: 'settings' as const, icon: Settings, label: 'Configuracion', description: 'Preferencias del sistema' },
  ]

  if (activeSection === 'users') {
    return <UsersSection onBack={() => setActiveSection('main')} />
  }

  if (activeSection === 'branches') {
    return <BranchesSection onBack={() => setActiveSection('main')} />
  }

  if (activeSection === 'reports') {
    return <ReportsSection onBack={() => setActiveSection('main')} />
  }

  if (activeSection === 'settings') {
    return <SettingsSection onBack={() => setActiveSection('main')} />
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <Card 
            key={section.id} 
            className="cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => setActiveSection(section.id)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{section.label}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ChevronRight className="h-5 w-5 rotate-180" />
      </Button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )
}

function UsersSection({ onBack }: { onBack: () => void }) {
  const { users, addUser, updateUser } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'seller' as UserRole })

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    addUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: true,
    })
    toast.success('Usuario agregado')
    setShowAddModal(false)
    setNewUser({ name: '', email: '', role: 'seller' })
  }

  return (
    <div>
      <SectionHeader title="Usuarios" onBack={onBack} />
      
      <Button className="w-full mb-4" onClick={() => setShowAddModal(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo usuario
      </Button>

      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center',
                user.role === 'admin' ? 'bg-primary/10' : 'bg-muted'
              )}>
                {user.role === 'admin' ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {user.role === 'admin' ? 'Admin' : 'Vendedor'}
                </span>
                <Switch
                  checked={user.active}
                  onCheckedChange={(active) => {
                    updateUser(user.id, { active })
                    toast.success(active ? 'Usuario activado' : 'Usuario desactivado')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add user modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card rounded-t-2xl p-4 pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nuevo usuario</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nombre completo"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Rol</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    variant={newUser.role === 'seller' ? 'default' : 'outline'}
                    onClick={() => setNewUser({ ...newUser, role: 'seller' })}
                  >
                    Vendedor
                  </Button>
                  <Button
                    variant={newUser.role === 'admin' ? 'default' : 'outline'}
                    onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                  >
                    Admin
                  </Button>
                </div>
              </div>
              <Button onClick={handleAddUser} className="mt-2">
                Agregar usuario
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BranchesSection({ onBack }: { onBack: () => void }) {
  const { branches, addBranch, currentBranch, setCurrentBranch } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')

  const handleAddBranch = () => {
    if (!newBranchName.trim()) {
      toast.error('Ingresa el nombre de la sucursal')
      return
    }
    addBranch({
      name: newBranchName,
      active: true,
    })
    toast.success('Sucursal agregada')
    setShowAddModal(false)
    setNewBranchName('')
  }

  return (
    <div>
      <SectionHeader title="Sucursales" onBack={onBack} />

      <Button className="w-full mb-4" onClick={() => setShowAddModal(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nueva sucursal
      </Button>

      <div className="flex flex-col gap-2">
        {branches.map((branch) => (
          <Card 
            key={branch.id}
            className={cn(
              'cursor-pointer transition-all',
              currentBranch?.id === branch.id && 'ring-2 ring-primary'
            )}
            onClick={() => {
              setCurrentBranch(branch)
              toast.success(`Trabajando en: ${branch.name}`)
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{branch.name}</h3>
                {currentBranch?.id === branch.id && (
                  <p className="text-xs text-primary">Activa</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add branch modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card rounded-t-2xl p-4 pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nueva sucursal</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Ej: Mercadito Dominical"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddBranch}>
                Agregar sucursal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReportsSection({ onBack }: { onBack: () => void }) {
  const { sales, getDashboardMetrics } = useStore()
  const metrics = getDashboardMetrics()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <SectionHeader title="Reportes" onBack={onBack} />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resumen de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total ventas</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.todaySales}</p>
                <p className="text-xs text-muted-foreground">Transacciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por metodo de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Efectivo</span>
                <span className="font-semibold">{formatCurrency(metrics.salesByCash)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Transferencia</span>
                <span className="font-semibold">{formatCurrency(metrics.salesByTransfer)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Otros</span>
                <span className="font-semibold">{formatCurrency(metrics.salesByOther)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {metrics.topProducts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Productos mas vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {metrics.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <span className="text-sm">{index + 1}. {product.name}</span>
                    <span className="text-sm text-muted-foreground">{product.count} ventas</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function SettingsSection({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <SectionHeader title="Configuracion" onBack={onBack} />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Negocio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label>Nombre del negocio</Label>
              <Input defaultValue="FIORA" className="mt-1" />
            </div>
            <div>
              <Label>Moneda</Label>
              <Input defaultValue="MXN" className="mt-1" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metodos de pago</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Efectivo</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Transferencia</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Otro</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Modo Mercadito por defecto</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sonidos de confirmacion</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          FIORA v1.0.0
        </p>
      </div>
    </div>
  )
}
