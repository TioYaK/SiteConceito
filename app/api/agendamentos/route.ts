import { NextResponse } from 'next/server';
import { getDb, saveDb, Agendamento, TransacaoCaixa } from '@/lib/store';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.agendamentos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    const servico = db.servicos.find(s => s.id === body.servicoId);
    const valorTotal = servico ? servico.precoTotal : Number(body.valorTotal || 0);
    const valorSinal = servico ? servico.valorSinal : Number(body.valorSinal || 30);

    const novoAgendamento: Agendamento = {
      id: `ag-${Date.now()}`,
      clienteNome: body.clienteNome,
      clienteTelefone: body.clienteTelefone,
      servicoId: body.servicoId || 'custom',
      servicoNome: servico ? servico.nome : (body.servicoNome || 'Atendimento'),
      data: body.data,
      horario: body.horario,
      duracaoMinutos: servico ? servico.duracaoMinutos : 60,
      valorTotal,
      valorSinal,
      sinalPago: body.sinalPago || false,
      status: body.sinalPago ? 'confirmado' : 'aguardando_sinal',
      pixCodigo: `00020126360014BR.GOV.BCB.PIX0111${db.configuracoes.chavePix}5204000053039865405${valorSinal.toFixed(2)}5802BR5925${db.configuracoes.nomeEmpresa.substring(0, 25)}6009CIDADE62070503***6304${Math.floor(1000 + Math.random() * 9000)}`,
      criadoVia: body.criadoVia || 'manual',
      observacoes: body.observacoes || '',
      createdAt: new Date().toISOString()
    };

    db.agendamentos.push(novoAgendamento);

    // Se o sinal já estiver marcado como pago (ex: manual), registra no caixa
    if (novoAgendamento.sinalPago) {
      const transacao: TransacaoCaixa = {
        id: `tx-${Date.now()}`,
        tipo: 'entrada',
        descricao: `Sinal recebido - ${novoAgendamento.clienteNome} (${novoAgendamento.servicoNome})`,
        valor: novoAgendamento.valorSinal,
        categoria: 'sinal_pix',
        formaPagamento: 'pix',
        data: new Date().toISOString(),
        agendamentoId: novoAgendamento.id
      };
      db.caixa.push(transacao);
    }

    await saveDb(db);
    return NextResponse.json(novoAgendamento, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
  }
}
