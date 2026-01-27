'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Check, X, Users, Package, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'

export default function FornecedoresPage() {
  const { fornecedores, produtos, loading, addFornecedor, updateFornecedor, deleteFornecedor } = useStore()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFornecedores = useMemo(() => {
    return fornecedores
      .filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [fornecedores, searchTerm])

  const handleAdd = async () => {
    if (newName.trim()) {
      await addFornecedor(newName.trim())
      setNewName('')
    }
  }

  const handleEdit = (id: number, name: string) => {
    setEditingId(id)
    setEditingName(name)
  }

  const handleSaveEdit = async () => {
    if (editingId && editingName.trim()) {
      await updateFornecedor(editingId, editingName.trim())
      setEditingId(null)
      setEditingName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor? Todos os produtos associados serao removidos.')) {
      await deleteFornecedor(id)
    }
  }

  const getProductCount = (fornecedorId: number) => {
    return produtos.filter(p => p.idFornecedor === fornecedorId).length
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
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Fornecedores</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Gerencie seus fornecedores</p>
      </div>

      <Card className="mb-4 md:mb-6">
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-base sm:text-lg">Adicionar Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex gap-2 sm:gap-3">
            <Input
              placeholder="Nome do fornecedor"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="h-11 flex-1 text-base sm:h-10 sm:text-sm"
            />
            <Button onClick={handleAdd} className="h-11 gap-2 px-4 sm:h-10 sm:px-4">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar fornecedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 text-base sm:h-10 sm:text-sm"
        />
      </div>

      {filteredFornecedores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground sm:text-lg">
              {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor'}
            </h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {searchTerm ? 'Tente uma busca diferente' : 'Adicione seu primeiro fornecedor para comecar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:grid-cols-3">
          {filteredFornecedores.map((fornecedor) => (
            <Card 
              key={fornecedor.id} 
              className="transition-all duration-200 hover:border-primary/50 active:scale-[0.98] sm:hover:shadow-md"
            >
              <CardContent className="p-4">
                {editingId === fornecedor.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      autoFocus
                      className="h-11 flex-1 text-base sm:h-10 sm:text-sm"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-11 w-11 sm:h-10 sm:w-10">
                      <Check className="h-5 w-5 text-primary sm:h-4 sm:w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-11 w-11 sm:h-10 sm:w-10">
                      <X className="h-5 w-5 text-muted-foreground sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-medium text-foreground sm:text-sm">{fornecedor.nome}</h3>
                        <div className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground sm:mt-2 sm:text-sm">
                          <Package className="h-4 w-4 flex-shrink-0" />
                          <span>{getProductCount(fornecedor.id!)} produtos</span>
                        </div>
                      </div>
                      <div className="ml-2 flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(fornecedor.id!, fornecedor.nome)}
                          className="h-10 w-10 sm:h-9 sm:w-9"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(fornecedor.id!)}
                          className="h-10 w-10 hover:text-destructive sm:h-9 sm:w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Link href={`/produtos?fornecedor=${fornecedor.id}`}>
                      <Button variant="secondary" className="mt-3 h-11 w-full gap-2 sm:mt-4 sm:h-9" size="sm">
                        Ver Produtos
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
