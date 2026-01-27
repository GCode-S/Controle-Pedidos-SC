'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Package, ShoppingCart, Users, RefreshCw, Settings } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Fornecedores', icon: Users },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/trocas', label: 'Trocas', icon: RefreshCw },
  { href: '/configuracoes', label: 'Config', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                isActive && 'bg-primary/15'
              )}>
                <item.icon className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none',
                isActive && 'text-primary'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
