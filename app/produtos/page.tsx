'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Check, X, Package, ChevronDown, ChevronUp, Search } from 'lucide-react'
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
  
  const { fornecedores, produtos, loading, addProduto, updateProduto, deleteProduto } = useStore()
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>(fornecedorIdParam || '')
  const [expandedFornecedores, setExpandedFornecedores] = useState<Set<number>>(
    fornecedorIdParam ? new Set([Number(fornecedorIdParam)]) : new Set()
  )
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
    setExpandedFornecedores(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleAdd = async () => {
    if (!selectedFornecedor || !newProduct.nome.trim()) return
    
    await addProduto({
      idFornecedor: Number(selectedFornecedor),
      nome: newProduct.nome.trim(),
      quantidade: Number(newProduct.quantidade) || 0,
      valorUnitario: Number(newProduct.valorUnitario) || 0,
      unidade: newProduct.unidade,
      quantidadeTroca: 0
    })
    
    setNewProduct({ nome: '', quantidade: '', valorUnitario: '', unidade: 'cx' })
    setExpandedFornecedores(prev => new Set(prev).add(Number(selectedFornecedor)))
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
      await updateProduto(editingId, {
        nome: editingProduct.nome.trim(),
        quantidade: Number(editingProduct.quantidade) || 0,
        valorUnitario: Number(editingProduct.valorUnitario) || 0,
        unidade: editingProduct.unidade
      })
      setEditingId(null)
      setEditingProduct({})
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
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
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Produtos</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Gerencie os produtos de cada fornecedor</p>
      </div>

      <Card className="mb-4 md:mb-6">
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-base sm:text-lg">Adicionar Produto</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-3">
            <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
              <SelectTrigger className="h-11 text-base sm:h-10 sm:text-sm">
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {sortedFornecedores.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)} className="text-base sm:text-sm">
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
            
            <div className="flex gap-3">
              <Select 
                value={newProduct.unidade} 
                onValueChange={(v) => setNewProduct(prev => ({ ...prev, unidade: v as Produto['unidade'] }))}
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
              
              <Button onClick={handleAdd} className="h-11 gap-2 px-4 sm:h-10">
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar produtos..."
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
            const isExpanded = expandedFornecedores.has(fornecedor.id!)
            const totalProdutos = produtos.filter(p => p.idFornecedor === fornecedor.id).length
            
            if (searchTerm && produtosList.length === 0) return null
            
            return (
              <Card key={fornecedor.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFornecedor(fornecedor.id!)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-accent/50 active:bg-accent sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                      <Package className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground sm:text-base">{fornecedor.nome}</h3>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {searchTerm ? `${produtosList.length} encontrado(s)` : `${totalProdutos} produtos`}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="border-t border-border">
                    {produtosList.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado para este fornecedor'}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {produtosList.map((produto) => (
                          <div key={produto.id} className="p-3 sm:p-4">
                            {editingId === produto.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editingProduct.nome || ''}
                                  onChange={(e) => setEditingProduct(prev => ({ ...prev, nome: e.target.value }))}
                                  placeholder="Nome"
                                  autoFocus
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
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1 space-y-2">
                                  <p className="text-sm font-medium text-foreground sm:text-base">{produto.nome}</p>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                                    <span>Qtd: <span className="font-medium text-foreground">{produto.quantidade} {produto.unidade}</span></span>
                                    <span>Unit: <span className="font-medium text-foreground">{formatCurrency(produto.valorUnitario)}</span></span>
                                    <span>Total: <span className="font-medium text-primary">{formatCurrency(produto.quantidade * produto.valorUnitario)}</span></span>
                                  </div>
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
