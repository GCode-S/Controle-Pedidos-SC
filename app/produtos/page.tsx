'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Check, X, Package, ChevronDown, ChevronUp } from 'lucide-react'
import type { Produto } from '@/lib/db'

const UNIDADES = [
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
]

function ProdutosContent() {
  const searchParams = useSearchParams()
  const fornecedorIdParam = searchParams.get('fornecedor')
  
  const { fornecedores, produtos, loading, addProduto, updateProduto, deleteProduto } = useStore()
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>(fornecedorIdParam || '')
  const [expandedFornecedores, setExpandedFornecedores] = useState<Set<number>>(
    fornecedorIdParam ? new Set([Number(fornecedorIdParam)]) : new Set()
  )
  
  const [newProduct, setNewProduct] = useState({
    nome: '',
    quantidade: '',
    valorUnitario: '',
    unidade: 'cx' as Produto['unidade']
  })
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Partial<Produto>>({})

  const produtosByFornecedor = useMemo(() => {
    const map = new Map<number, Produto[]>()
    for (const produto of produtos) {
      const list = map.get(produto.idFornecedor) || []
      list.push(produto)
      map.set(produto.idFornecedor, list)
    }
    return map
  }, [produtos])

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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Produtos</h1>
        <p className="mt-1 text-muted-foreground">Gerencie os produtos de cada fornecedor</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Adicionar Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
              <SelectTrigger>
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Nome do produto"
              value={newProduct.nome}
              onChange={(e) => setNewProduct(prev => ({ ...prev, nome: e.target.value }))}
            />
            
            <Input
              type="number"
              placeholder="Quantidade"
              value={newProduct.quantidade}
              onChange={(e) => setNewProduct(prev => ({ ...prev, quantidade: e.target.value }))}
            />
            
            <Input
              type="number"
              step="0.01"
              placeholder="Valor unitario"
              value={newProduct.valorUnitario}
              onChange={(e) => setNewProduct(prev => ({ ...prev, valorUnitario: e.target.value }))}
            />
            
            <div className="flex gap-2">
              <Select 
                value={newProduct.unidade} 
                onValueChange={(v) => setNewProduct(prev => ({ ...prev, unidade: v as Produto['unidade'] }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {fornecedores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum fornecedor cadastrado</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Cadastre um fornecedor primeiro para adicionar produtos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fornecedores.map((fornecedor) => {
            const produtosList = produtosByFornecedor.get(fornecedor.id!) || []
            const isExpanded = expandedFornecedores.has(fornecedor.id!)
            
            return (
              <Card key={fornecedor.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFornecedor(fornecedor.id!)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{fornecedor.nome}</h3>
                      <p className="text-sm text-muted-foreground">{produtosList.length} produtos</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="border-t border-border">
                    {produtosList.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        Nenhum produto cadastrado para este fornecedor
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {produtosList.map((produto) => (
                          <div key={produto.id} className="p-4">
                            {editingId === produto.id ? (
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <Input
                                  value={editingProduct.nome || ''}
                                  onChange={(e) => setEditingProduct(prev => ({ ...prev, nome: e.target.value }))}
                                  placeholder="Nome"
                                  autoFocus
                                />
                                <Input
                                  type="number"
                                  value={editingProduct.quantidade || ''}
                                  onChange={(e) => setEditingProduct(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                                  placeholder="Quantidade"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingProduct.valorUnitario || ''}
                                  onChange={(e) => setEditingProduct(prev => ({ ...prev, valorUnitario: Number(e.target.value) }))}
                                  placeholder="Valor"
                                />
                                <Select
                                  value={editingProduct.unidade || 'cx'}
                                  onValueChange={(v) => setEditingProduct(prev => ({ ...prev, unidade: v as Produto['unidade'] }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIDADES.map((u) => (
                                      <SelectItem key={u.value} value={u.value}>
                                        {u.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                                    <Check className="h-4 w-4" />
                                    Salvar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="grid flex-1 gap-1 sm:grid-cols-4 sm:gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Produto</p>
                                    <p className="font-medium text-foreground">{produto.nome}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Quantidade</p>
                                    <p className="font-medium text-foreground">{produto.quantidade} {produto.unidade}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Valor Unitario</p>
                                    <p className="font-medium text-foreground">{formatCurrency(produto.valorUnitario)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="font-medium text-primary">{formatCurrency(produto.quantidade * produto.valorUnitario)}</p>
                                  </div>
                                </div>
                                <div className="ml-4 flex gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => handleEdit(produto)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(produto.id!)}
                                    className="hover:text-destructive"
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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <ProdutosContent />
    </Suspense>
  )
}
