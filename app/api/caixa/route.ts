import { NextResponse } from 'next/server';
import { getDb, saveDb, TransacaoCaixa } from '@/lib/store';

export async function GET() {
  const db = await getDb();
  
  const totalEntradas = db.caixa
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalSaidas = db.caixa
    .filter(t => t.tipo === 'saida')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  return NextResponse.json({
    transacoes: db.caixa.slice().reverse(),
    resumo: {
      totalEntradas,
      totalSaidas,
      saldoLiquido,
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    const novaTransacao: TransacaoCaixa = {
      id: `tx-${Date.now()}`,
      tipo: body.tipo, // 'entrada' | 'saida'
      descricao: body.descricao,
      valor: Number(body.valor),
      categoria: body.categoria || (body.tipo === 'entrada' ? 'servico_balcao' : 'custo_insumos'),
      formaPagamento: body.formaPagamento || 'pix',
      data: new Date().toISOString()
    };

    db.caixa.push(novaTransacao);
    await saveDb(db);

    return NextResponse.json(novaTransacao, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar movimentação de caixa' }, { status: 500 });
  }
}
