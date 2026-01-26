'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RefreshCw, Package, Minus, Plus, X } from 'lucide-react'

export default function TrocasPage() {
  const { fornecedores, produtos, loading, updateProduto } = useStore()

  const produtosComTroca = useMemo(() => {
    return produtos.filter(p => (p.quantidadeTroca ?? 0) > 0)
  }, [produtos])

  const produtosSemTroca = useMemo(() => {
    return produtos.filter(p => (p.quantidadeTroca ?? 0) === 0)
  }, [produtos])

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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Trocas</h1>
        <p className="mt-1 text-muted-foreground">Produtos danificados ou para troca</p>
      </div>

      {produtosComTroca.length === 0 ? (
        <Card className="mb-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <RefreshCw className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum item para troca</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Adicione quantidade de troca aos produtos abaixo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Itens para Troca</h2>
          {Array.from(trocasByFornecedor).map(([fornecedorId, produtosList]) => (
            <Card key={fornecedorId}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <RefreshCw className="h-5 w-5 text-destructive" />
                  </div>
                  <CardTitle className="text-lg">{getFornecedorNome(fornecedorId)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {produtosList.map((produto) => (
                    <div key={produto.id} className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(produto.valorUnitario)} / {produto.unidade}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleUpdateTroca(produto.id!, (produto.quantidadeTroca ?? 0) - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={produto.quantidadeTroca ?? 0}
                            onChange={(e) => handleUpdateTroca(produto.id!, Number(e.target.value))}
                            className="h-8 w-16 text-center"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleUpdateTroca(produto.id!, (produto.quantidadeTroca ?? 0) + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
          ))}
        </div>
      )}

      {produtosSemTroca.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Adicionar Troca</h2>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 divide-y divide-border overflow-y-auto">
                {produtosSemTroca.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">{getFornecedorNome(produto.idFornecedor)}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 bg-transparent"
                      onClick={() => handleAddTroca(produto.id!, produto.quantidadeTroca ?? 0)}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
