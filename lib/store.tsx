'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Product, Sale, User, Branch, PaymentMethod, ConnectionStatus, AppState, DashboardMetrics, CartItem } from './types'
import { generateProductCode } from './types'

// Initial mock data
const initialProducts: Product[] = [
  { id: '1', code: 'FIO-A001', name: 'Anillo Esmeralda', price: 1250, stock: 5, image: '/products/ring-1.jpg', category: 'Anillos', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', code: 'FIO-C001', name: 'Collar Perlas', price: 890, stock: 3, image: '/products/necklace-1.jpg', category: 'Collares', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', code: 'FIO-E001', name: 'Aretes Diamante', price: 2100, stock: 2, image: '/products/earrings-1.jpg', category: 'Aretes', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', code: 'FIO-P001', name: 'Pulsera Oro', price: 1500, stock: 8, image: '/products/bracelet-1.jpg', category: 'Pulseras', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', code: 'FIO-A002', name: 'Anillo Zafiro', price: 1800, stock: 1, image: '/products/ring-2.jpg', category: 'Anillos', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', code: 'FIO-C002', name: 'Collar Plata', price: 450, stock: 12, image: '/products/necklace-2.jpg', category: 'Collares', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', code: 'FIO-E002', name: 'Aretes Perla', price: 680, stock: 6, image: '/products/earrings-2.jpg', category: 'Aretes', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', code: 'FIO-P002', name: 'Pulsera Jade', price: 920, stock: 4, image: '/products/bracelet-2.jpg', category: 'Pulseras', createdAt: new Date(), updatedAt: new Date() },
]

const initialUsers: User[] = [
  { id: '1', name: 'Admin FIORA', email: 'admin@fiora.com', role: 'admin', active: true, createdAt: new Date() },
  { id: '2', name: 'Maria Vendedora', email: 'maria@fiora.com', role: 'seller', active: true, createdAt: new Date() },
]

const initialBranches: Branch[] = [
  { id: '1', name: 'Tienda Principal', active: true, createdAt: new Date() },
  { id: '2', name: 'Mercadito Sabatino', active: true, createdAt: new Date() },
]

const todaySales: Sale[] = [
  { id: 's1', productId: '1', productName: 'Anillo Esmeralda', productImage: '/products/ring-1.jpg', price: 1250, originalPrice: 1250, paymentMethod: 'cash', userId: '2', createdAt: new Date(Date.now() - 3600000), synced: true },
  { id: 's2', productId: '2', productName: 'Collar Perlas', productImage: '/products/necklace-1.jpg', price: 890, originalPrice: 890, paymentMethod: 'transfer', userId: '2', createdAt: new Date(Date.now() - 7200000), synced: true },
  { id: 's3', productId: '6', productName: 'Collar Plata', productImage: '/products/necklace-2.jpg', price: 400, originalPrice: 450, paymentMethod: 'cash', userId: '1', createdAt: new Date(Date.now() - 10800000), synced: true },
]

interface StoreContextType extends AppState {
  cart: CartItem[]
  setMercaditoMode: (mode: boolean) => void
  addSale: (productId: string, paymentMethod: PaymentMethod, customPrice?: number) => void
  addProduct: (product: Omit<Product, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateStock: (id: string, newStock: number) => void
  deleteSale: (id: string) => void
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void
  updateUser: (id: string, updates: Partial<User>) => void
  addBranch: (branch: Omit<Branch, 'id' | 'createdAt'>) => void
  setCurrentBranch: (branch: Branch | null) => void
  getDashboardMetrics: () => DashboardMetrics
  // Cart functions
  addToCart: (product: Product, customPrice?: number) => void
  removeFromCart: (productId: string) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  checkoutCart: (paymentMethod: PaymentMethod) => void
  getCartTotal: () => number
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [sales, setSales] = useState<Sale[]>(todaySales)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [currentUser] = useState<User | null>(initialUsers[0])
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(initialBranches[0])
  const [mercaditoMode, setMercaditoMode] = useState(false)
  const [connectionStatus] = useState<ConnectionStatus>('online')
  const [pendingSales] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])

  const addSale = useCallback((productId: string, paymentMethod: PaymentMethod, customPrice?: number) => {
    const product = products.find(p => p.id === productId)
    if (!product || product.stock <= 0) return

    const newSale: Sale = {
      id: `s${Date.now()}`,
      productId,
      productName: product.name,
      productImage: product.image,
      price: customPrice ?? product.price,
      originalPrice: product.price,
      paymentMethod,
      userId: currentUser?.id ?? '1',
      branchId: currentBranch?.id,
      createdAt: new Date(),
      synced: connectionStatus === 'online',
    }

    setSales(prev => [newSale, ...prev])
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: p.stock - 1, updatedAt: new Date() } : p
    ))
  }, [products, currentUser, currentBranch, connectionStatus])

  const addProduct = useCallback((product: Omit<Product, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: `p${Date.now()}`,
      code: generateProductCode(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setProducts(prev => [...prev, newProduct])
  }, [])

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ))
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const updateStock = useCallback((id: string, newStock: number) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, stock: Math.max(0, newStock), updatedAt: new Date() } : p
    ))
  }, [])

  const deleteSale = useCallback((id: string) => {
    const sale = sales.find(s => s.id === id)
    if (sale) {
      setSales(prev => prev.filter(s => s.id !== id))
      // Restore stock
      setProducts(prev => prev.map(p => 
        p.id === sale.productId ? { ...p, stock: p.stock + 1, updatedAt: new Date() } : p
      ))
    }
  }, [sales])

  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: `u${Date.now()}`,
      createdAt: new Date(),
    }
    setUsers(prev => [...prev, newUser])
  }, [])

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, ...updates } : u
    ))
  }, [])

  const addBranch = useCallback((branch: Omit<Branch, 'id' | 'createdAt'>) => {
    const newBranch: Branch = {
      ...branch,
      id: `b${Date.now()}`,
      createdAt: new Date(),
    }
    setBranches(prev => [...prev, newBranch])
  }, [])

  // Cart functions
  const addToCart = useCallback((product: Product, customPrice?: number) => {
    if (product.stock <= 0) return
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        // Check if we can add more
        if (existing.quantity >= product.stock) return prev
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1, customPrice }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }, [])

  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId))
      return
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: Math.min(quantity, item.product.stock) }
        : item
    ))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const price = item.customPrice ?? item.product.price
      return total + (price * item.quantity)
    }, 0)
  }, [cart])

  const checkoutCart = useCallback((paymentMethod: PaymentMethod) => {
    cart.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        const newSale: Sale = {
          id: `s${Date.now()}-${item.product.id}-${i}`,
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.image,
          price: item.customPrice ?? item.product.price,
          originalPrice: item.product.price,
          paymentMethod,
          userId: currentUser?.id ?? '1',
          branchId: currentBranch?.id,
          createdAt: new Date(),
          synced: connectionStatus === 'online',
        }
        setSales(prev => [newSale, ...prev])
      }
      
      // Update stock
      setProducts(prev => prev.map(p => 
        p.id === item.product.id 
          ? { ...p, stock: p.stock - item.quantity, updatedAt: new Date() } 
          : p
      ))
    })
    setCart([])
  }, [cart, currentUser, currentBranch, connectionStatus])

  const getDashboardMetrics = useCallback((): DashboardMetrics => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaysSales = sales.filter(s => new Date(s.createdAt) >= today)
    
    const salesByCash = todaysSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.price, 0)
    const salesByTransfer = todaysSales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.price, 0)
    const salesByOther = todaysSales.filter(s => s.paymentMethod === 'other').reduce((sum, s) => sum + s.price, 0)
    
    const productCounts: Record<string, number> = {}
    todaysSales.forEach(s => {
      productCounts[s.productName] = (productCounts[s.productName] || 0) + 1
    })
    
    const topProducts = Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    const lowStockProducts = products.filter(p => p.stock <= 3).sort((a, b) => a.stock - b.stock)
    
    return {
      todaySales: todaysSales.length,
      totalRevenue: salesByCash + salesByTransfer + salesByOther,
      salesByCash,
      salesByTransfer,
      salesByOther,
      topProducts,
      lowStockProducts,
    }
  }, [sales, products])

  return (
    <StoreContext.Provider value={{
      products,
      sales,
      users,
      branches,
      currentUser,
      currentBranch,
      mercaditoMode,
      connectionStatus,
      pendingSales,
      cart,
      setMercaditoMode,
      addSale,
      addProduct,
      updateProduct,
      deleteProduct,
      updateStock,
      deleteSale,
      addUser,
      updateUser,
      addBranch,
      setCurrentBranch,
      getDashboardMetrics,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      checkoutCart,
      getCartTotal,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
