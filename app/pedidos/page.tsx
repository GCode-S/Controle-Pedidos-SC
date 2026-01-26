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

  // Set first supplier as default if none selected
  useEffect(() => {
    if (!selectedFornecedorId && fornecedores.length > 0) {
      setSelectedFornecedorId(fornecedores[0].id!)
    }
  }, [fornecedores, selectedFornecedorId, setSelectedFornecedorId])

  const selectedFornecedor = useMemo(() => {
    return fornecedores.find(f => f.id === selectedFornecedorId)
  }, [fornecedores, selectedFornecedorId])

  // Filter products by selected supplier with quantity > 0
  const produtosNoPedido = useMemo(() => {
    if (!selectedFornecedorId) return []
    return produtos.filter(p => p.idFornecedor === selectedFornecedorId && p.quantidade > 0)
  }, [produtos, selectedFornecedorId])

  const total = useMemo(() => {
    return produtosNoPedido.reduce((sum, p) => sum + (p.quantidade * p.valorUnitario), 0)
  }, [produtosNoPedido])

  // Count items per supplier for the selector
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
    
    // Header
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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (fornecedores.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Pedidos</h1>
          <p className="mt-1 text-muted-foreground">Selecione um fornecedor para visualizar o pedido</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum fornecedor cadastrado</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Cadastre um fornecedor primeiro para criar pedidos
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Pedidos</h1>
          <p className="mt-1 text-muted-foreground">Pedido individual por fornecedor</p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select 
            value={selectedFornecedorId?.toString() || ''} 
            onValueChange={(v) => setSelectedFornecedorId(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {fornecedoresComPedido.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  <span className="flex items-center gap-2">
                    {f.nome}
                    {f.itemCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {f.itemCount} {f.itemCount === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {produtosNoPedido.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLimparPedido} className="gap-2 bg-transparent">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
              <Button onClick={() => setShowNameDialog(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                Gerar PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {selectedFornecedor && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{selectedFornecedor.nome}</h3>
              <p className="text-sm text-muted-foreground">
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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum item no pedido</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Adicione quantidade aos produtos de {selectedFornecedor?.nome} para criar um pedido
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-y border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Produto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Quantidade</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Valor Unit.</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {produtosNoPedido.map((produto) => (
                      <tr key={produto.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{produto.nome}</td>
                        <td className="px-4 py-3 text-foreground">{produto.quantidade} {produto.unidade}</td>
                        <td className="px-4 py-3 text-foreground">{formatCurrency(produto.valorUnitario)}</td>
                        <td className="px-4 py-3 text-right font-medium text-primary">
                          {formatCurrency(produto.quantidade * produto.valorUnitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-border bg-muted/30 py-3">
              <p className="text-sm font-medium text-foreground">
                Total: <span className="text-lg text-primary">{formatCurrency(total)}</span>
              </p>
            </CardFooter>
          </Card>

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex items-center justify-between py-6">
              <p className="text-lg font-semibold text-foreground">Total do Pedido - {selectedFornecedor?.nome}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar PDF do Pedido</DialogTitle>
            <DialogDescription>
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
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleGeneratePDF} disabled={!userName.trim()}>
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
