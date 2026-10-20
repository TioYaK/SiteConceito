import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/store';

export async function GET(request: Request) {
  return handleWebhook(request);
}

export async function POST(request: Request) {
  return handleWebhook(request);
}

async function handleWebhook(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    let paymentId = searchParams.get('data.id') || searchParams.get('id');
    const topic = searchParams.get('type') || searchParams.get('topic');

    // Se veio no body JSON
    if (!paymentId && request.method === 'POST') {
      try {
        const body = await request.json();
        paymentId = body.data?.id || body.id;
      } catch (_) {}
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, message: 'Nenhum paymentId recebido' });
    }

    const db = await getDb();
    const token = db.configuracoes.mercadoPagoAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Token Mercado Pago não configurado' }, { status: 400 });
    }

    // Consulta os detalhes oficiais do pagamento na API do Mercado Pago
    const resMp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`
      }
    });

    if (!resMp.ok) {
      console.warn(`Webhook MP: Pagamento ${paymentId} não encontrado ou token inválido`);
      return NextResponse.json({ ok: true });
    }

    const payment = await resMp.json();
    const status = payment.status; // 'approved', 'pending', 'rejected', etc.
    const externalRef = payment.external_reference; // 'ag-...' ou 'ped-...'
    const valorPago = payment.transaction_amount || 0;
    const metodoPagamento = payment.payment_method_id || 'cartao';

    console.log(`🔔 Webhook Mercado Pago: Pagamento ${paymentId} status: ${status}, ref: ${externalRef}, valor: R$ ${valorPago}`);

    if (status === 'approved' && externalRef) {
      let alterado = false;
      const hojeStr = new Date().toISOString().split('T')[0];

      // 1. Se for um agendamento
      if (externalRef.startsWith('ag-')) {
        const ag = (db.agendamentos || []).find(a => a.id === externalRef);
        if (ag && (!ag.sinalPago || ag.status === 'aguardando_sinal')) {
          ag.sinalPago = true;
          ag.status = 'confirmado';
          alterado = true;

          if (!db.caixa) db.caixa = [];
          db.caixa.unshift({
            id: `cx-${Date.now()}`,
            tipo: 'entrada',
            descricao: `Sinal Confirmado (Mercado Pago) - ${ag.servicoNome} (${ag.clienteNome})`,
            valor: ag.valorSinal,
            categoria: 'sinal_pix',
            formaPagamento: metodoPagamento.includes('pix') ? 'pix' : 'cartao_credito',
            data: hojeStr,
            agendamentoId: ag.id
          });
        }
      }

      // 2. Se for um pedido de produtos
      if (externalRef.startsWith('ped-')) {
        const ped = (db.pedidos || []).find(p => p.id === externalRef);
        if (ped && (!ped.pago || ped.status === 'aguardando_pix')) {
          ped.pago = true;
          ped.status = 'preparando';
          alterado = true;

          if (!db.caixa) db.caixa = [];
          db.caixa.unshift({
            id: `cx-${Date.now()}`,
            tipo: 'entrada',
            descricao: `Venda de Produtos (Mercado Pago) - Pedido #${ped.id.slice(-4)} (${ped.clienteNome})`,
            valor: ped.valorTotal,
            categoria: 'produto',
            formaPagamento: metodoPagamento.includes('pix') ? 'pix' : 'cartao_credito',
            data: hojeStr
          });
        }
      }

      if (alterado) {
        await saveDb(db);
        console.log(`✅ Pagamento ${paymentId} confirmado no sistema com sucesso para ref: ${externalRef}`);
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    console.error('Erro no processamento do Webhook Mercado Pago:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
