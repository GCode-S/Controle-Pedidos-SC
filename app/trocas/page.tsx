'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RefreshCw, Package, Minus, Plus, X, Search } from 'lucide-react'

export default function TrocasPage() {
  const { fornecedores, produtos, loading, updateProduto } = useStore()
  const [searchTerm, setSearchTerm] = useState('')

  const sortedFornecedores = useMemo(() => {
    return [...fornecedores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [fornecedores])

  const produtosComTroca = useMemo(() => {
    return produtos
      .filter(p => (p.quantidadeTroca ?? 0) > 0)
      .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [produtos, searchTerm])

  const produtosSemTroca = useMemo(() => {
    return produtos
      .filter(p => (p.quantidadeTroca ?? 0) === 0)
      .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [produtos, searchTerm])

  const trocasByFornecedor = useMemo(() => {
    const map = new Map<number, typeof produtosComTroca>()
    for (const produto of produtosComTroca) {
      const list = map.get(produto.idFornecedor) || []
      list.push(produto)
      map.set(produto.idFornecedor, list)
    }
    return map
  }, [produtosComTroca])

  const getFornecedorNome = (id: number) => {
    return fornecedores.find(f => f.id === id)?.nome || 'Desconhecido'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const handleUpdateTroca = async (id: number, quantidade: number) => {
    await updateProduto(id, { quantidadeTroca: Math.max(0, quantidade) })
  }

  const handleRemoveTroca = async (id: number) => {
    await updateProduto(id, { quantidadeTroca: 0 })
  }

  const handleAddTroca = async (id: number, currentTroca: number) => {
    await updateProduto(id, { quantidadeTroca: currentTroca + 1 })
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
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Trocas</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Produtos danificados ou para troca</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 text-base sm:h-10 sm:text-sm"
        />
      </div>

      {produtosComTroca.length === 0 && !searchTerm ? (
        <Card className="mb-6 border-dashed sm:mb-8">
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <RefreshCw className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground sm:text-lg">Nenhum item para troca</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Adicione quantidade de troca aos produtos abaixo
            </p>
          </CardContent>
        </Card>
      ) : produtosComTroca.length > 0 ? (
        <div className="mb-6 space-y-3 sm:mb-8 sm:space-y-4">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Itens para Troca</h2>
          {sortedFornecedores.map((fornecedor) => {
            const produtosList = trocasByFornecedor.get(fornecedor.id!)
            if (!produtosList || produtosList.length === 0) return null
            
            return (
              <Card key={fornecedor.id}>
                <CardHeader className="px-4 py-3 sm:px-6 sm:pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/10 sm:h-10 sm:w-10">
                      <RefreshCw className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">{fornecedor.nome}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {produtosList.map((produto) => (
                      <div key={produto.id} className="flex items-center justify-between gap-3 p-3 sm:p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground sm:text-base">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {formatCurrency(produto.valorUnitario)} / {produto.unidade}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 rounded-r-none bg-transparent sm:h-8 sm:w-8"
                              onClick={() => handleUpdateTroca(produto.id!, (produto.quantidadeTroca ?? 0) - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={produto.quantidadeTroca ?? 0}
                              onChange={(e) => handleUpdateTroca(produto.id!, Number(e.target.value))}
                              className="h-10 w-14 rounded-none border-x-0 text-center text-base sm:h-8 sm:w-12 sm:text-sm"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 rounded-l-none bg-transparent sm:h-8 sm:w-8"
                              onClick={() => handleUpdateTroca(produto.id!, (produto.quantidadeTroca ?? 0) + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-8"
                            onClick={() => handleRemoveTroca(produto.id!)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      {produtosSemTroca.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Adicionar Troca</h2>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-80 divide-y divide-border overflow-y-auto sm:max-h-96">
                {produtosSemTroca.map((produto) => (
                  <div 
                    key={produto.id} 
                    className="flex items-center justify-between gap-3 p-3 transition-colors active:bg-muted/50 sm:p-4 sm:hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted sm:h-8 sm:w-8">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{produto.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">{getFornecedorNome(produto.idFornecedor)}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 gap-1 bg-transparent px-3 text-sm sm:h-8 sm:px-3"
                      onClick={() => handleAddTroca(produto.id!, produto.quantidadeTroca ?? 0)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Adicionar</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {produtosSemTroca.length === 0 && produtosComTroca.length === 0 && searchTerm && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground sm:text-lg">Nenhum produto encontrado</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Tente uma busca diferente
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
