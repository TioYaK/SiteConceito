import { NextResponse } from 'next/server';
import { getDb, saveDb, TransacaoCaixa } from '@/lib/store';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = getDb();
    if (!db.pedidos) db.pedidos = [];

    const index = db.pedidos.findIndex(p => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const pedido = db.pedidos[index];

    // Se confirmou o PIX
    if (body.action === 'confirmar_pix' && !pedido.pago) {
      pedido.pago = true;
      pedido.status = 'preparando';

      const transacao: TransacaoCaixa = {
        id: `tx-${Date.now()}`,
        tipo: 'entrada',
        descricao: `Venda WhatsApp PIX (${pedido.itens.map(i => i.nome).join(', ')}) - ${pedido.clienteNome}`,
        valor: pedido.valorTotal,
        categoria: 'produto',
        formaPagamento: 'pix',
        data: new Date().toISOString()
      };
      db.caixa.push(transacao);
    } 
    // Alterar status do envio
    else if (body.status) {
      pedido.status = body.status;
      if (body.rastreio) pedido.rastreio = body.rastreio;
    } 
    else {
      Object.assign(pedido, body);
    }

    saveDb(db);
    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
  }
}
