'use client'

import React from "react"

import { useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Settings, Sun, Moon, Download, Upload, Database, AlertTriangle } from 'lucide-react'

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()
  const { exportData, importData, loading } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')

  const handleExport = async () => {
    const data = await exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setImportJson(content)
      setShowImportDialog(true)
    }
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    try {
      setImportError('')
      JSON.parse(importJson)
      await importData(importJson)
      setShowImportDialog(false)
      setImportJson('')
    } catch {
      setImportError('JSON invalido. Verifique o formato do arquivo.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Configuracoes</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Personalize o aplicativo e gerencie seus dados</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Aparencia</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Escolha entre modo claro e escuro</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="theme-switch" className="cursor-pointer text-sm sm:text-base">Modo Escuro</Label>
              </div>
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Backup de Dados</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Exporte ou importe seus dados em formato JSON</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button 
                onClick={handleExport} 
                variant="outline" 
                className="h-12 flex-1 gap-2 bg-transparent text-base sm:h-10 sm:text-sm"
              >
                <Download className="h-4 w-4" />
                Exportar Dados
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-12 flex-1 gap-2 text-base sm:h-10 sm:text-sm"
              >
                <Upload className="h-4 w-4" />
                Importar Dados
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
            
            <div className="rounded-lg border border-border bg-muted/50 p-3 sm:p-4">
              <p className="text-xs text-muted-foreground sm:text-sm">
                O arquivo JSON deve conter os campos <code className="rounded bg-muted px-1">fornecedores</code> e{' '}
                <code className="rounded bg-muted px-1">produtos</code>. Os IDs serao recriados automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Sobre o Aplicativo</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Informacoes sobre o sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-2 text-xs text-muted-foreground sm:space-y-3 sm:text-sm">
              <p><strong className="text-foreground">Versao:</strong> 1.0.0</p>
              <p><strong className="text-foreground">Criador:</strong> <a href="https://github.com/GCode-S">GCode-S</a></p>
              <p><strong className="text-foreground">Tecnologias:</strong> Next.js, TypeScript, Tailwind CSS, Dexie.js</p>
              <p className="pt-2">
                Este aplicativo funciona 100% no navegador, sem necessidade de conexao com servidores externos.
                Todos os dados sao armazenados localmente no seu dispositivo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="mx-4 max-w-xl rounded-lg sm:mx-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Importar Dados</DialogTitle>
            <DialogDescription className="text-sm">
              Revise os dados antes de importar. Esta acao substituira todos os dados existentes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive sm:text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {importError}
              </div>
            )}
            <Textarea
              value={importJson}
              onChange={(e) => {
                setImportJson(e.target.value)
                setImportError('')
              }}
              className="h-48 font-mono text-xs sm:h-64 sm:text-sm"
              placeholder="Cole o JSON aqui..."
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(false)}
              className="h-11 w-full text-base sm:h-10 sm:w-auto sm:text-sm"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!importJson.trim()}
              className="h-11 w-full text-base sm:h-10 sm:w-auto sm:text-sm"
            >
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
