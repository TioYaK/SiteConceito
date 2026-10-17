import { NextResponse } from 'next/server';
import { getDb, saveDb, TransacaoCaixa } from '@/lib/store';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = await getDb();

    const index = db.agendamentos.findIndex(a => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    const agendamento = db.agendamentos[index];

    // Caso 1: Confirmando recebimento do sinal via PIX
    if (body.action === 'confirmar_sinal' && !agendamento.sinalPago) {
      agendamento.sinalPago = true;
      agendamento.status = 'confirmado';

      const transacao: TransacaoCaixa = {
        id: `tx-${Date.now()}`,
        tipo: 'entrada',
        descricao: `Sinal PIX recebido - ${agendamento.clienteNome} (${agendamento.servicoNome})`,
        valor: agendamento.valorSinal,
        categoria: 'sinal_pix',
        formaPagamento: 'pix',
        data: new Date().toISOString(),
        agendamentoId: agendamento.id
      };
      db.caixa.push(transacao);
    }

    // Caso 2: Concluindo atendimento (receber o restante no balcão)
    else if (body.action === 'concluir_atendimento') {
      agendamento.status = 'concluido';
      const valorRestante = Math.max(0, agendamento.valorTotal - (agendamento.sinalPago ? agendamento.valorSinal : 0));

      if (valorRestante > 0) {
        const transacao: TransacaoCaixa = {
          id: `tx-${Date.now()}`,
          tipo: 'entrada',
          descricao: `Restante no balcão - ${agendamento.clienteNome} (${agendamento.servicoNome})`,
          valor: valorRestante,
          categoria: 'servico_balcao',
          formaPagamento: body.formaPagamentoRestante || 'pix',
          data: new Date().toISOString(),
          agendamentoId: agendamento.id
        };
        db.caixa.push(transacao);
      }
    }

    // Caso 3: Cancelando agendamento
    else if (body.action === 'cancelar') {
      agendamento.status = 'cancelado';
      agendamento.observacoes = (agendamento.observacoes ? agendamento.observacoes + ' | ' : '') + 'Agendamento cancelado.';
    }

    // Caso 4: Edição genérica de campos
    else {
      Object.assign(agendamento, body);
    }

    await saveDb(db);
    return NextResponse.json(agendamento);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}
