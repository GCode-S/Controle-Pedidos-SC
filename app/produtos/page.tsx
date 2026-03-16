'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Plus, Minus, Pencil, Trash2, Check, X, Package, ChevronDown, ChevronUp, Search, FileText, Eye, EyeOff } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Produto } from '@/lib/db'

const UNIDADES = [
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'un', label: 'Unidade (un)' },
  
]

function ProdutosContent() {
  const searchParams = useSearchParams()
  const fornecedorIdParam = searchParams.get('fornecedor')

  const { fornecedores, produtos, loading, addFornecedor, addProduto, updateProduto, deleteProduto, limparPedidoByFornecedor } = useStore()
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>(fornecedorIdParam || '')
  const [expandedFornecedor, setExpandedFornecedor] = useState<number | null>(
    fornecedorIdParam ? Number(fornecedorIdParam) : null
  )
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false)
  const [createFornecedorId, setCreateFornecedorId] = useState<number | null>(null)
  const [showCreateFornecedorDialog, setShowCreateFornecedorDialog] = useState(false)
  const [newFornecedorNome, setNewFornecedorNome] = useState('')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [userName, setUserName] = useState('')
  const [pdfFornecedorId, setPdfFornecedorId] = useState<number | null>(null)
  const [produtoFilterMode, setProdutoFilterMode] = useState<'all' | 'with-quantity'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [newProduct, setNewProduct] = useState({
    nome: '',
    quantidade: '',
    valorUnitario: '',
    unidade: 'cx' as Produto['unidade']
  })
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Partial<Produto>>({})

  const sortedFornecedores = useMemo(() => {
    return [...fornecedores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [fornecedores])

  const produtosByFornecedor = useMemo(() => {
    const map = new Map<number, Produto[]>()
    for (const produto of produtos) {
      if (searchTerm && !produto.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        continue
      }
      const list = map.get(produto.idFornecedor) || []
      list.push(produto)
      map.set(produto.idFornecedor, list)
    }
    // Sort products alphabetically within each supplier
    for (const [key, value] of map) {
      map.set(key, value.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
    }
    return map
  }, [produtos, searchTerm])

  const toggleFornecedor = (id: number) => {
    setExpandedFornecedor((prev) => (prev === id ? null : id))
  }

  const resetCreateProductForm = () => {
    setNewProduct({ nome: '', quantidade: '', valorUnitario: '', unidade: 'cx' })
  }

  const handleOpenCreateProductDialog = (fornecedorId: number) => {
    setCreateFornecedorId(fornecedorId)
    resetCreateProductForm()
    setShowCreateProductDialog(true)
  }

  const handleCreateDialogChange = (open: boolean) => {
    setShowCreateProductDialog(open)
    if (!open) {
      setCreateFornecedorId(null)
      resetCreateProductForm()
    }
  }

  const handleAdd = async () => {
    if (!createFornecedorId || !newProduct.nome.trim()) return
    
    await addProduto({
      idFornecedor: createFornecedorId,
      nome: newProduct.nome.trim(),
      quantidade: Number(newProduct.quantidade) || 0,
      valorUnitario: Number(newProduct.valorUnitario) || 0,
      unidade: newProduct.unidade,
      quantidadeTroca: 0
    })
    
    resetCreateProductForm()
    setExpandedFornecedor(createFornecedorId)
    setShowCreateProductDialog(false)
    setCreateFornecedorId(null)
  }

  const handleEdit = (produto: Produto) => {
    setEditingId(produto.id!)
    setEditingProduct({
      nome: produto.nome,
      quantidade: produto.quantidade,
      valorUnitario: produto.valorUnitario,
      unidade: produto.unidade
    })
  }

  const handleSaveEdit = async () => {
    if (editingId && editingProduct.nome?.trim()) {
      try{
        await updateProduto(editingId, {
        nome: editingProduct.nome.trim(),
        quantidade: Number(editingProduct.quantidade) || 0,
        valorUnitario: Number(editingProduct.valorUnitario) || 0,
        unidade: editingProduct.unidade
        })
        setEditingId(null)
        setEditingProduct({})
      }catch (error){
        console.error('Erro ao salvar produto: ', error)
      }

     
    }
  }

  const handleCreateFornecedorDialogChange = (open: boolean) => {
    setShowCreateFornecedorDialog(open)
    if (!open) {
      setNewFornecedorNome('')
    }
  }

  const handleAddFornecedor = async () => {
    if (!newFornecedorNome.trim()) return

    await addFornecedor(newFornecedorNome.trim())
    setShowCreateFornecedorDialog(false)
    setNewFornecedorNome('')
  }


  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingProduct({})
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduto(id)
    }
  }

  const handleQuickQtdChange = async (id: number, currentQtd: number, delta: number) => {
    try {
      const newQtd = Math.max(0, currentQtd + delta)
      await updateProduto(id, { quantidade: newQtd })
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error)
    }
  }

  const handleOpenPdfDialog = (fornecedorId: number) => {
    setPdfFornecedorId(fornecedorId)
    setUserName('')
    setShowNameDialog(true)
  }

  const handleGeneratePDF = () => {
    if (!userName.trim() || !pdfFornecedorId) return

    const selectedFornecedor = fornecedores.find((fornecedor) => fornecedor.id === pdfFornecedorId)
    if (!selectedFornecedor) return

    const produtosNoPedido = produtos
      .filter((produto) => produto.idFornecedor === pdfFornecedorId && produto.quantidade > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

    if (produtosNoPedido.length === 0) return

    const total = produtosNoPedido.reduce((sum, produto) => sum + (produto.quantidade * produto.valorUnitario), 0)

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Pedido', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Usuario: ${userName}`, 14, 35)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 42)
    doc.text(`Fornecedor: ${selectedFornecedor.nome}`, 14, 49)

    const tableData = produtosNoPedido.map((produto) => [
      produto.nome,
      `${produto.quantidade} ${produto.unidade}`,
      formatCurrency(produto.valorUnitario),
      formatCurrency(produto.quantidade * produto.valorUnitario),
    ])

    autoTable(doc, {
      startY: 60,
      head: [['Produto', 'Quantidade', 'Valor Unit.', 'Subtotal']],
      body: tableData,
      foot: [['', '', 'Total:', formatCurrency(total)]],
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 34], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
      margin: { left: 14, right: 14, bottom: 20 },
      styles: { cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
      didDrawPage: () => {
        const pageNumber = doc.getCurrentPageInfo().pageNumber
        const totalPages = doc.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(128)
        doc.text(`Pagina ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        doc.text('GCode-S - Controle de Pedidos', 14, pageHeight - 10)
        doc.text(new Date().toLocaleString('pt-BR'), pageWidth - 14, pageHeight - 10, { align: 'right' })
      },
    })

    doc.save(`pedido-${selectedFornecedor.nome.replace(/\s+/g, '-')}-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
    setShowNameDialog(false)
    setUserName('')
    setPdfFornecedorId(null)
  }

  const handleLimparPedidoFornecedor = async (fornecedorId: number, fornecedorNome: string) => {
    const temItensNoPedido = produtos.some((produto) => produto.idFornecedor === fornecedorId && produto.quantidade > 0)
    if (!temItensNoPedido) return

    if (confirm(`Tem certeza que deseja limpar o pedido do fornecedor ${fornecedorNome}? Todas as quantidades serao zeradas.`)) {
      await limparPedidoByFornecedor(fornecedorId)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const fornecedorEmCriacao = fornecedores.find((fornecedor) => fornecedor.id === createFornecedorId)

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
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Gerenciamento</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Gerencie os fornecedores e seus produtos</p>
      </div>


      <Button onClick={() => setShowCreateFornecedorDialog(true)} className="mb-4">
        <Plus className="h-4 w-4" />
        <span className=" sm:inline">Adicionar Fornecedor</span>
      </Button>


      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar produtos"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 text-base sm:h-10 sm:text-sm"
        />
      </div>

      {sortedFornecedores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground sm:text-lg">Nenhum fornecedor cadastrado</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Cadastre um fornecedor primeiro para adicionar produtos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sortedFornecedores
            .filter(f => !selectedFornecedor || f.id === Number(selectedFornecedor))
            .map((fornecedor) => {
            const produtosList = produtosByFornecedor.get(fornecedor.id!) || []
            const produtosListFiltrados = produtoFilterMode === 'with-quantity'
              ? produtosList.filter((produto) => produto.quantidade > 0)
              : produtosList
            const isExpanded = expandedFornecedor === fornecedor.id
            const totalProdutos = produtos.filter(p => p.idFornecedor === fornecedor.id).length
            
            if (searchTerm && produtosListFiltrados.length === 0) return null
            
            return (
              <Card key={fornecedor.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFornecedor(fornecedor.id!)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-accent/50 active:bg-accent sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                      <Package className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground sm:text-xl">{fornecedor.nome}</h3>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {(searchTerm || produtoFilterMode === 'with-quantity')
                          ? `${produtosListFiltrados.length} encontrado(s)`
                          : `${totalProdutos} produtos`}
                      </p>
                    </div>
                    
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="border-t border-border px-3 py-2 sm:px-4 sm:py-3">
                    <div className="mb-3 sm:mb-4">
                      <div className="flex w-full  flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <ToggleGroup
                          type="single"
                          value={produtoFilterMode}
                          onValueChange={(value) => {
                            if (value === 'all' || value === 'with-quantity') {
                              setProdutoFilterMode(value)
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full mb-6 sm:w-auto"
                        >
                          <ToggleGroupItem
                            value="all"
                            className="group text-xs transition-all duration-300 ease-out data-[state=on]:shadow-sm sm:text-sm"
                          >
                            <Eye className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-data-[state=on]:scale-110 group-data-[state=on]:rotate-6" />
                            <span className="transition-all duration-300 ease-out group-data-[state=on]:font-semibold">Todos</span>
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="with-quantity"
                            className="group text-xs transition-all duration-300 ease-out data-[state=on]:shadow-sm sm:text-sm"
                          >
                            <EyeOff className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-data-[state=on]:scale-110 group-data-[state=on]:-rotate-6" />
                            <span className="transition-all duration-300 ease-out group-data-[state=on]:font-semibold">Pedidos</span>
                          </ToggleGroupItem>
                        </ToggleGroup>

                        <div className="flex w-full flex-col-reverse mb-8 gap-2 sm:w-auto sm:flex-row">
                        <Button onClick={() => handleOpenCreateProductDialog(fornecedor.id!)} className="h-11 gap-2 px-4 sm:h-10">
                          <Plus className="h-4 w-4" />
                          <span className="sm:inline">Adicionar produto</span>
                        </Button>
                        <div className='gap-5 flex-row sm:gap-5 flex'>
                              <Button
                                variant="outline"
                                onClick={() => handleLimparPedidoFornecedor(fornecedor.id!, fornecedor.nome)}
                                disabled={!produtos.some((produto) => produto.idFornecedor === fornecedor.id && produto.quantidade > 0)}
                                // no celular esse botão fica do lado do de baixo
                                className="h-11 gap-2 bg-transparent text-base sm:h-10 sm:text-sm"
                              >
                                <Trash2 className="h-4 w-4" />
                                Limpar
                              </Button>
                              <Button
                                onClick={() => handleOpenPdfDialog(fornecedor.id!)}
                                disabled={!produtos.some((produto) => produto.idFornecedor === fornecedor.id && produto.quantidade > 0)}
                                className="h-11 gap-2 bg-blue-700 text-white  sm:h-10 sm:text-sm"
                              >
                                <FileText className="h-4 w-4" />
                                Gerar PDF
                              </Button>
                        </div>
                        
                        </div>
                      </div>
                    </div>
                    {produtosListFiltrados.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {produtoFilterMode === 'with-quantity'
                          ? 'Nenhum produto com quantidade maior que 0'
                          : searchTerm
                            ? 'Nenhum produto encontrado'
                            : 'Nenhum produto cadastrado para este fornecedor'}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        
                        {produtosListFiltrados.map((produto) => (
                          <div key={produto.id} className="p-3 sm:p-4">
                            {editingId === produto.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editingProduct.nome || ''}
                                  onChange={(e) => setEditingProduct(prev => ({ ...prev, nome: e.target.value }))}
                                  placeholder="Nome"
                                  // autoFocus
                                  className="h-11 text-base sm:h-10 sm:text-sm"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <Input
                                    type="number"
                                    value={editingProduct.quantidade || ''}
                                    onChange={(e) => setEditingProduct(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                                    placeholder="Qtd"
                                    className="h-11 text-base sm:h-10 sm:text-sm"
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editingProduct.valorUnitario || ''}
                                    onChange={(e) => setEditingProduct(prev => ({ ...prev, valorUnitario: Number(e.target.value) }))}
                                    placeholder="Valor"
                                    className="h-11 text-base sm:h-10 sm:text-sm"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Select
                                    value={editingProduct.unidade || 'cx'}
                                    onValueChange={(v) => setEditingProduct(prev => ({ ...prev, unidade: v as Produto['unidade'] }))}
                                  >
                                    <SelectTrigger className="h-11 flex-1 text-base sm:h-10 sm:text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {UNIDADES.map((u) => (
                                        <SelectItem key={u.value} value={u.value} className="text-base sm:text-sm">
                                          {u.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" onClick={handleSaveEdit} className="h-11 gap-1 px-4 sm:h-10">
                                    <Check className="h-4 w-4" />
                                    <span className="hidden sm:inline">Salvar</span>
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-11 w-11 bg-transparent sm:h-10 sm:w-10">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground sm:text-base">{produto.nome}</p>
                                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                      Unitário: <span className="font-medium text-foreground">{formatCurrency(produto.valorUnitario)}</span>
                                    </p>
                                  </div>

                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(produto)} className="h-10 w-10 sm:h-9 sm:w-9">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleDelete(produto.id!)}
                                      className="h-10 w-10 hover:text-destructive sm:h-9 sm:w-9"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="inline-flex w-full items-center sm:w-auto">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-10 w-10 rounded-r-none bg-transparent sm:h-9 sm:w-9"
                                      onClick={() => handleQuickQtdChange(produto.id!, produto.quantidade, -1)}
                                      disabled={produto.quantidade <= 0}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <div className="flex h-10 min-w-22 items-center justify-center border-y border-input px-2 text-sm font-semibold text-foreground sm:h-9">
                                      {produto.quantidade} {produto.unidade}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-10 w-10 rounded-l-none bg-transparent sm:h-9 sm:w-9"
                                      onClick={() => handleQuickQtdChange(produto.id!, produto.quantidade, 1)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <p className="text-right text-sm font-semibold text-primary sm:text-base">
                                    Total: {formatCurrency(produto.quantidade * produto.valorUnitario)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showCreateProductDialog} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="mx-2 w-[calc(100%-1rem)] max-w-sm rounded-lg p-3 sm:mx-4 sm:w-auto sm:max-w-lg sm:p-4 md:max-w-xl md:p-6">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg md:text-xl">Novo produto</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm md:text-base">
              {fornecedorEmCriacao ? `Fornecedor: ${fornecedorEmCriacao.nome}` : 'Selecione um fornecedor na lista para adicionar produto.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 sm:space-y-4 sm:py-4">
            <Input
              placeholder="Nome do produto"
              value={newProduct.nome}
              onChange={(e) => setNewProduct(prev => ({ ...prev, nome: e.target.value }))}
              className="h-11 text-base sm:h-10 sm:text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Quantidade"
                value={newProduct.quantidade}
                onChange={(e) => setNewProduct(prev => ({ ...prev, quantidade: e.target.value }))}
                className="h-11 text-base sm:h-10 sm:text-sm"
              />

              <Input
                type="number"
                step="0.01"
                placeholder="Valor R$"
                value={newProduct.valorUnitario}
                onChange={(e) => setNewProduct(prev => ({ ...prev, valorUnitario: e.target.value }))}
                className="h-11 text-base sm:h-10 sm:text-sm"
              />
            </div>

            <Select
              value={newProduct.unidade}
              onValueChange={(v) => setNewProduct(prev => ({ ...prev, unidade: v as Produto['unidade'] }))}
            >
              <SelectTrigger className="h-11 text-base sm:h-10 sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES.map((u) => (
                  <SelectItem key={u.value} value={u.value} className="text-base sm:text-sm">
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2.5 md:gap-3">
            <Button
              variant="outline"
              onClick={() => handleCreateDialogChange(false)}
              className="h-9 w-full bg-transparent text-xs sm:h-10 sm:w-auto sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!createFornecedorId || !newProduct.nome.trim()}
              className="h-9 w-full text-xs sm:h-10 sm:w-auto sm:text-sm"
            >
              Adicionar produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFornecedorDialog} onOpenChange={handleCreateFornecedorDialogChange}>
        <DialogContent className="mx-2 w-[calc(100%-1rem)] max-w-sm rounded-lg p-3 sm:mx-4 sm:w-auto sm:max-w-lg sm:p-4 md:max-w-xl md:p-6">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg md:text-xl">Novo fornecedor</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm md:text-base">
              Digite o nome para criar um novo fornecedor.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 sm:py-4">
            <Input
              placeholder="Nome do fornecedor"
              value={newFornecedorNome}
              onChange={(e) => setNewFornecedorNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFornecedor()}
              autoFocus
              className="h-11 text-base sm:h-10 sm:text-sm"
            />
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2.5 md:gap-3">
            <Button
              variant="outline"
              onClick={() => handleCreateFornecedorDialogChange(false)}
              className="h-9 w-full bg-transparent text-xs sm:h-10 sm:w-auto sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddFornecedor}
              disabled={!newFornecedorNome.trim()}
              className="h-9 w-full text-xs sm:h-10 sm:w-auto sm:text-sm"
            >
              Adicionar fornecedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="mx-4 max-w-md rounded-lg sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Gerar PDF do Pedido</DialogTitle>
            <DialogDescription className="text-sm">
              Pedido do fornecedor: {fornecedores.find((fornecedor) => fornecedor.id === pdfFornecedorId)?.nome || '-'}
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
              onClick={() => {
                setShowNameDialog(false)
                setPdfFornecedorId(null)
                setUserName('')
              }}
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

export default function ProdutosPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <ProdutosContent />
    </Suspense>
  )
}
