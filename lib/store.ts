'use client'

import { create } from 'zustand'
import { 
  type Fornecedor, 
  type Produto,
  getFornecedores,
  getProdutos,
  addFornecedor as dbAddFornecedor,
  updateFornecedor as dbUpdateFornecedor,
  deleteFornecedor as dbDeleteFornecedor,
  addProduto as dbAddProduto,
  updateProduto as dbUpdateProduto,
  deleteProduto as dbDeleteProduto,
  limparPedido as dbLimparPedido,
  limparPedidoByFornecedor as dbLimparPedidoByFornecedor,
  exportDatabase,
  importDatabase
} from './db'

interface AppState {
  fornecedores: Fornecedor[]
  produtos: Produto[]
  loading: boolean
  selectedFornecedorId: number | null
  
  // Actions
  loadData: () => Promise<void>
  setSelectedFornecedorId: (id: number | null) => void
  addFornecedor: (nome: string) => Promise<void>
  updateFornecedor: (id: number, nome: string) => Promise<void>
  deleteFornecedor: (id: number) => Promise<void>
  addProduto: (produto: Omit<Produto, 'id'>) => Promise<void>
  updateProduto: (id: number, updates: Partial<Produto>) => Promise<void>
  deleteProduto: (id: number) => Promise<void>
  limparPedido: () => Promise<void>
  limparPedidoByFornecedor: (idFornecedor: number) => Promise<void>
  exportData: () => Promise<string>
  importData: (json: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  fornecedores: [],
  produtos: [],
  loading: true,
  selectedFornecedorId: null,
  
  loadData: async () => {
    set({ loading: true })
    const fornecedores = await getFornecedores()
    const produtos = await getProdutos()
    set({ fornecedores, produtos, loading: false })
  },
  
  setSelectedFornecedorId: (id: number | null) => {
    set({ selectedFornecedorId: id })
  },
  
  addFornecedor: async (nome: string) => {
    const id = await dbAddFornecedor(nome)
    set((state) => ({
      fornecedores: [...state.fornecedores, { id, nome }],
    }))
  },
  
  updateFornecedor: async (id: number, nome: string) => {
    await dbUpdateFornecedor(id, nome)
    set((state) => ({
      fornecedores: state.fornecedores.map((fornecedor) =>
        fornecedor.id === id ? { ...fornecedor, nome } : fornecedor,
      ),
    }))
  },
  
  deleteFornecedor: async (id: number) => {
    await dbDeleteFornecedor(id)
    set((state) => ({
      fornecedores: state.fornecedores.filter((fornecedor) => fornecedor.id !== id),
      produtos: state.produtos.filter((produto) => produto.idFornecedor !== id),
      selectedFornecedorId: state.selectedFornecedorId === id ? null : state.selectedFornecedorId,
    }))
  },
  
  addProduto: async (produto: Omit<Produto, 'id'>) => {
    const id = await dbAddProduto(produto)
    set((state) => ({
      produtos: [...state.produtos, { ...produto, id }],
    }))
  },
  
  updateProduto: async (id: number, updates: Partial<Produto>) => {
    await dbUpdateProduto(id, updates)
    set((state) => ({
      produtos: state.produtos.map((produto) =>
        produto.id === id ? { ...produto, ...updates } : produto,
      ),
    }))
  },
  
  deleteProduto: async (id: number) => {
    await dbDeleteProduto(id)
    set((state) => ({
      produtos: state.produtos.filter((produto) => produto.id !== id),
    }))
  },
  
  limparPedido: async () => {
    await dbLimparPedido()
    set((state) => ({
      produtos: state.produtos.map((produto) => ({ ...produto, quantidade: 0 })),
    }))
  },
  
  limparPedidoByFornecedor: async (idFornecedor: number) => {
    await dbLimparPedidoByFornecedor(idFornecedor)
    set((state) => ({
      produtos: state.produtos.map((produto) =>
        produto.idFornecedor === idFornecedor ? { ...produto, quantidade: 0 } : produto,
      ),
    }))
  },
  
  exportData: async () => {
    const data = await exportDatabase()
    return JSON.stringify(data, null, 2)
  },
  
  importData: async (json: string) => {
    const data = JSON.parse(json)
    await importDatabase(data)
    await get().loadData()
  }
}))
