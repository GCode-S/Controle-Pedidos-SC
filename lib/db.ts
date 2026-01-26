import Dexie, { type EntityTable } from 'dexie'

export interface Fornecedor {
  id?: number
  nome: string
}

export interface Produto {
  id?: number
  idFornecedor: number
  nome: string
  quantidade: number
  valorUnitario: number
  unidade: 'cx' | 'L' | 'g' | 'kg'
  quantidadeTroca?: number
}

export const db = new Dexie('ControlePedidosDB') as Dexie & {
  fornecedores: EntityTable<Fornecedor, 'id'>
  produtos: EntityTable<Produto, 'id'>
}

db.version(1).stores({
  fornecedores: '++id, nome',
  produtos: '++id, idFornecedor, nome, quantidade, valorUnitario, unidade, quantidadeTroca'
})

// Helper functions
export async function getFornecedores() {
  return await db.fornecedores.toArray()
}

export async function addFornecedor(nome: string) {
  return await db.fornecedores.add({ nome })
}

export async function updateFornecedor(id: number, nome: string) {
  return await db.fornecedores.update(id, { nome })
}

export async function deleteFornecedor(id: number) {
  await db.produtos.where('idFornecedor').equals(id).delete()
  return await db.fornecedores.delete(id)
}

export async function getProdutos() {
  return await db.produtos.toArray()
}

export async function getProdutosByFornecedor(idFornecedor: number) {
  return await db.produtos.where('idFornecedor').equals(idFornecedor).toArray()
}

export async function addProduto(produto: Omit<Produto, 'id'>) {
  return await db.produtos.add(produto)
}

export async function updateProduto(id: number, updates: Partial<Produto>) {
  return await db.produtos.update(id, updates)
}

export async function deleteProduto(id: number) {
  return await db.produtos.delete(id)
}

export async function getProdutosComTroca() {
  return await db.produtos.filter(p => (p.quantidadeTroca ?? 0) > 0).toArray()
}

export async function getProdutosNoPedido() {
  return await db.produtos.filter(p => p.quantidade > 0).toArray()
}

export async function limparPedido() {
  const produtos = await db.produtos.toArray()
  for (const produto of produtos) {
    await db.produtos.update(produto.id!, { quantidade: 0 })
  }
}

export async function limparPedidoByFornecedor(idFornecedor: number) {
  const produtos = await db.produtos.where('idFornecedor').equals(idFornecedor).toArray()
  for (const produto of produtos) {
    await db.produtos.update(produto.id!, { quantidade: 0 })
  }
}

export async function exportDatabase() {
  const fornecedores = await db.fornecedores.toArray()
  const produtos = await db.produtos.toArray()
  return { fornecedores, produtos }
}

export async function importDatabase(data: { fornecedores: Array<{ nome: string; id?: number }>; produtos: Array<{ idFornecedor: string | number; nome: string; quantidade: number; valor?: number; valorUnitario?: number; id?: number; unidade?: string; quantidadeTroca?: number }> }) {
  await db.fornecedores.clear()
  await db.produtos.clear()
  
  const fornecedorIdMap = new Map<number | string, number>()
  
  for (const fornecedor of data.fornecedores) {
    const oldId = fornecedor.id
    const newId = await db.fornecedores.add({ nome: fornecedor.nome })
    if (oldId !== undefined) {
      fornecedorIdMap.set(oldId, newId)
      fornecedorIdMap.set(String(oldId), newId)
    }
  }
  
  for (const produto of data.produtos) {
    const idFornecedor = fornecedorIdMap.get(produto.idFornecedor) ?? Number(produto.idFornecedor)
    await db.produtos.add({
      idFornecedor,
      nome: produto.nome,
      quantidade: produto.quantidade ?? 0,
      valorUnitario: produto.valor ?? produto.valorUnitario ?? 0,
      unidade: (produto.unidade as Produto['unidade']) ?? 'cx',
      quantidadeTroca: produto.quantidadeTroca ?? 0
    })
  }
}
