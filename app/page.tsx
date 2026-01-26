'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Check, X, Users, Package } from 'lucide-react'
import Link from 'next/link'

export default function FornecedoresPage() {
  const { fornecedores, produtos, loading, addFornecedor, updateFornecedor, deleteFornecedor } = useStore()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center md:h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Fornecedores</h1>
        <p className="mt-1 text-muted-foreground">Gerencie seus fornecedores e seus produtos</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Adicionar Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Nome do fornecedor"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {fornecedores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum fornecedor</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Adicione seu primeiro fornecedor para comecar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fornecedores.map((fornecedor) => (
            <Card 
              key={fornecedor.id} 
              className="group transition-all duration-200 hover:border-primary/50 hover:shadow-md"
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
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{fornecedor.nome}</h3>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{getProductCount(fornecedor.id!)} produtos</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(fornecedor.id!, fornecedor.nome)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(fornecedor.id!)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {editingId !== fornecedor.id && (
                  <Link href={`/produtos?fornecedor=${fornecedor.id}`}>
                    <Button variant="secondary" className="mt-4 w-full" size="sm">
                      Ver Produtos
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
