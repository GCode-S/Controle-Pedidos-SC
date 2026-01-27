'use client'

import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ShoppingCart, FileText, Trash2, Package, AlertCircle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function PedidosPage() {
  const { 
    fornecedores, 
    produtos, 
    loading, 
    selectedFornecedorId, 
    setSelectedFornecedorId,
    limparPedidoByFornecedor 
  } = useStore()
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!selectedFornecedorId && fornecedores.length > 0) {
      setSelectedFornecedorId(fornecedores[0].id!)
    }
  }, [fornecedores, selectedFornecedorId, setSelectedFornecedorId])

  const selectedFornecedor = useMemo(() => {
    return fornecedores.find(f => f.id === selectedFornecedorId)
  }, [fornecedores, selectedFornecedorId])

  const produtosNoPedido = useMemo(() => {
    if (!selectedFornecedorId) return []
    return produtos.filter(p => p.idFornecedor === selectedFornecedorId && p.quantidade > 0)
  }, [produtos, selectedFornecedorId])

  const total = useMemo(() => {
    return produtosNoPedido.reduce((sum, p) => sum + (p.quantidade * p.valorUnitario), 0)
  }, [produtosNoPedido])

  const fornecedoresComPedido = useMemo(() => {
    return fornecedores.map(f => {
      const count = produtos.filter(p => p.idFornecedor === f.id && p.quantidade > 0).length
      return { ...f, itemCount: count }
    })
  }, [fornecedores, produtos])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const handleGeneratePDF = () => {
    if (!userName.trim() || !selectedFornecedor) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Pedido', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Usuario: ${userName}`, 14, 35)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 42)
    doc.text(`Fornecedor: ${selectedFornecedor.nome}`, 14, 49)

    const yPosition = 60

    const tableData = produtosNoPedido.map(p => [
      p.nome,
      `${p.quantidade} ${p.unidade}`,
      formatCurrency(p.valorUnitario),
      formatCurrency(p.quantidade * p.valorUnitario)
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Produto', 'Quantidade', 'Valor Unit.', 'Subtotal']],
      body: tableData,
      foot: [['', '', 'Total:', formatCurrency(total)]],
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 34] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    })

    doc.save(`pedido-${selectedFornecedor.nome.replace(/\s+/g, '-')}-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
    setShowNameDialog(false)
    setUserName('')
  }

  const handleLimparPedido = async () => {
    if (!selectedFornecedorId) return
    if (confirm(`Tem certeza que deseja limpar o pedido do fornecedor ${selectedFornecedor?.nome}? Todas as quantidades serao zeradas.`)) {
      await limparPedidoByFornecedor(selectedFornecedorId)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (fornecedores.length === 0) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-6 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Selecione um fornecedor para visualizar o pedido</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground sm:text-lg">Nenhum fornecedor cadastrado</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Cadastre um fornecedor primeiro para criar pedidos
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 md:p-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Pedido individual por fornecedor</p>
      </div>
      
      <div className="mb-4 space-y-3 sm:mb-6">
        <Select 
          value={selectedFornecedorId?.toString() || ''} 
          onValueChange={(v) => setSelectedFornecedorId(Number(v))}
        >
          <SelectTrigger className="h-12 w-full text-base sm:h-10 sm:text-sm">
            <SelectValue placeholder="Selecione um fornecedor" />
          </SelectTrigger>
          <SelectContent>
            {fornecedoresComPedido.map((f) => (
              <SelectItem key={f.id} value={String(f.id)} className="text-base sm:text-sm">
                <span className="flex items-center gap-2">
                  {f.nome}
                  {f.itemCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {f.itemCount}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {produtosNoPedido.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleLimparPedido} 
              className="h-11 flex-1 gap-2 bg-transparent text-base sm:h-10 sm:flex-none sm:text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
            <Button 
              onClick={() => setShowNameDialog(true)} 
              className="h-11 flex-1 gap-2 text-base sm:h-10 sm:flex-none sm:text-sm"
            >
              <FileText className="h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        )}
      </div>

      {selectedFornecedor && (
        <Card className="mb-4 border-primary/30 bg-primary/5 sm:mb-6">
          <CardContent className="flex items-center gap-3 p-3 sm:py-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-foreground sm:text-base">{selectedFornecedor.nome}</h3>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {produtosNoPedido.length === 0 
                  ? 'Nenhum item no pedido' 
                  : `${produtosNoPedido.length} ${produtosNoPedido.length === 1 ? 'item' : 'itens'} no pedido`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {produtosNoPedido.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground sm:text-lg">Nenhum item no pedido</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Adicione quantidade aos produtos de {selectedFornecedor?.nome} para criar um pedido
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-4 py-3 sm:px-6 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {produtosNoPedido.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 sm:p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground sm:text-base">{produto.nome}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:text-sm">
                        <span>{produto.quantidade} {produto.unidade}</span>
                        <span>{formatCurrency(produto.valorUnitario)}</span>
                      </div>
                    </div>
                    <p className="ml-3 text-sm font-semibold text-primary sm:text-base">
                      {formatCurrency(produto.quantidade * produto.valorUnitario)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary sm:text-xl">{formatCurrency(total)}</p>
            </CardFooter>
          </Card>
        </div>
      )}

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="mx-4 max-w-md rounded-lg sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Gerar PDF do Pedido</DialogTitle>
            <DialogDescription className="text-sm">
              Pedido do fornecedor: {selectedFornecedor?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Seu nome"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeneratePDF()}
              autoFocus
              className="h-12 text-base sm:h-10 sm:text-sm"
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNameDialog(false)} 
              className="h-11 w-full bg-transparent text-base sm:h-10 sm:w-auto sm:text-sm"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGeneratePDF} 
              disabled={!userName.trim()}
              className="h-11 w-full text-base sm:h-10 sm:w-auto sm:text-sm"
            >
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
