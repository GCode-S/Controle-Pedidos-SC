'use client'

import React from "react"

import { useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { MobileHeader } from './mobile-header'
import { useStore } from '@/lib/store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const loadData = useStore((state) => state.loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="min-h-screen bg-background transition-colors">
      <AppSidebar />
      <MobileHeader />
      <main className="md:pl-64">
        <div className="min-h-screen pt-14 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
