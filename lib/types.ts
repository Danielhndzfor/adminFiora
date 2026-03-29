export interface Product {
  id: string
  code: string
  name: string
  price: number
  stock: number
  image: string
  category?: string
  createdAt: Date
  updatedAt: Date
}

export const PRODUCT_CATEGORIES = [
  'Anillos',
  'Collares',
  'Aretes',
  'Pulseras',
  'Dijes',
  'Cadenas',
  'Broches',
  'Sets',
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]

// Generate product code: FIO-XXXX (4 random alphanumeric)
export function generateProductCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'FIO-'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export interface Sale {
  id: string
  productId: string
  productName: string
  productImage: string
  price: number
  originalPrice: number
  paymentMethod: PaymentMethod
  userId: string
  branchId?: string
  createdAt: Date
  synced: boolean
}

export type PaymentMethod = 'cash' | 'transfer' | 'other'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: Date
}

export type UserRole = 'admin' | 'seller'

export interface Branch {
  id: string
  name: string
  active: boolean
  createdAt: Date
}

export type ConnectionStatus = 'online' | 'offline' | 'pending'

export interface CartItem {
  product: Product
  quantity: number
  customPrice?: number
}

export interface AppState {
  products: Product[]
  sales: Sale[]
  users: User[]
  branches: Branch[]
  currentUser: User | null
  currentBranch: Branch | null
  mercaditoMode: boolean
  connectionStatus: ConnectionStatus
  pendingSales: number
}

export interface DashboardMetrics {
  todaySales: number
  totalRevenue: number
  salesByCash: number
  salesByTransfer: number
  salesByOther: number
  topProducts: { name: string; count: number }[]
  lowStockProducts: Product[]
}
