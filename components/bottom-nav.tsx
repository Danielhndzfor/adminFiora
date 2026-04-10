'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Package, History, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/ventas', icon: ShoppingBag, label: 'Vender' },
  { href: '/inventario', icon: Package, label: 'Inventario' },
  { href: '/historial', icon: History, label: 'Historial' },
  { href: '/admin', icon: Settings, label: 'Menú' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          // Para '/', solo es active si pathname es exactamente '/'
          // Para otros, es active si pathname === href O pathname.startsWith(href)
          const isActive = href === '/' ? pathname === '/' : (pathname === href || pathname.startsWith(href))
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                'active:bg-muted/50',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 mb-1', isActive && 'stroke-[2.5]')} />
              <span className={cn(
                'text-[10px] font-medium',
                isActive && 'font-semibold'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
