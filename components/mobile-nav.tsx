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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200 active:scale-95 active:bg-accent/50',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200',
                isActive && 'bg-primary/15 scale-110'
              )}>
                <item.icon className={cn(
                  'h-[22px] w-[22px] transition-all duration-200',
                  isActive && 'stroke-[2.5px]'
                )} />
              </div>
              <span className={cn(
                'text-[11px] font-medium leading-none tracking-tight',
                isActive && 'font-semibold'
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
