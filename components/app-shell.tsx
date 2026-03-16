'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { MobileNav } from './mobile-nav'
import { useStore } from '@/lib/store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const loadData = useStore((state) => state.loadData)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background transition-colors">
      {mounted && <AppSidebar />}
      {mounted && <MobileNav />}
      <main className="md:pl-64">
        <div className="min-h-screen pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  )
}
