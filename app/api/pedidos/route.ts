import { NextResponse } from 'next/server';
import { getDb, saveDb, Pedido, TransacaoCaixa } from '@/lib/store';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.pedidos || []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    if (!db.pedidos) db.pedidos = [];

    const valorItens = Number(body.valorItens || 0);
    const valorFrete = Number(body.valorFrete || 0);
    const valorTotal = valorItens + valorFrete;

    const pixCode = `00020126360014BR.GOV.BCB.PIX0111${db.configuracoes.chavePix}5204000053039865405${valorTotal.toFixed(2)}5802BR5925${db.configuracoes.nomeEmpresa.substring(0, 25)}6009SAO PAULO62070503***6304${Math.floor(1000 + Math.random() * 9000)}`;

    const novoPedido: Pedido = {
      id: `ped-${Date.now()}`,
      clienteNome: body.clienteNome,
      clienteTelefone: body.clienteTelefone,
      itens: body.itens || [],
      tipoEntrega: body.tipoEntrega || 'retirada',
      endereco: body.endereco || '',
      bairro: body.bairro || '',
      cidade: body.cidade || '',
      cep: body.cep || '',
      valorItens,
      valorFrete,
      valorTotal,
      status: body.pago ? 'preparando' : 'aguardando_pix',
      pixCodigo: pixCode,
      pago: body.pago || false,
      createdAt: new Date().toISOString()
    };

    // Baixa automática no estoque para os itens vendidos
    if (Array.isArray(novoPedido.itens)) {
      novoPedido.itens.forEach(item => {
        const prod = db.estoque.find(e => e.id === item.produtoId);
        if (prod) {
          prod.quantidade = Math.max(0, prod.quantidade - item.quantidade);
        }
      });
    }

    // Se estiver pago, lança no caixa
    if (novoPedido.pago) {
      const transacao: TransacaoCaixa = {
        id: `tx-${Date.now()}`,
        tipo: 'entrada',
        descricao: `Venda de Produtos (${novoPedido.itens.map(i => i.nome).join(', ')}) - ${novoPedido.clienteNome}`,
        valor: novoPedido.valorTotal,
        categoria: 'produto',
        formaPagamento: 'pix',
        data: new Date().toISOString()
      };
      db.caixa.push(transacao);
    }

    db.pedidos.unshift(novoPedido);
    saveDb(db);

    return NextResponse.json(novoPedido, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 });
  }
}
