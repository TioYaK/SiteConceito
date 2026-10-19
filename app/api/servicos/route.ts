import { NextResponse } from 'next/server';
import { getDb, saveDb, Servico } from '@/lib/store';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.servicos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // 1. Ação de Excluir Serviço
    if (body.action === 'excluir' && body.id) {
      db.servicos = db.servicos.filter(s => s.id !== body.id);
      await saveDb(db);
      return NextResponse.json({ sucesso: true, mensagem: 'Serviço excluído' });
    }

    // 2. Ação de Editar Serviço Existente
    if ((body.action === 'editar' || body.id) && body.action !== 'novo') {
      const index = db.servicos.findIndex(s => s.id === body.id);
      if (index !== -1) {
        db.servicos[index] = {
          ...db.servicos[index],
          nome: body.nome ?? db.servicos[index].nome,
          descricao: body.descricao ?? db.servicos[index].descricao,
          duracaoMinutos: body.duracaoMinutos !== undefined ? Number(body.duracaoMinutos) : db.servicos[index].duracaoMinutos,
          precoTotal: body.precoTotal !== undefined ? Number(body.precoTotal) : db.servicos[index].precoTotal,
          valorSinal: body.valorSinal !== undefined ? Number(body.valorSinal) : db.servicos[index].valorSinal,
          categoria: body.categoria ?? db.servicos[index].categoria,
          ativo: body.ativo !== undefined ? body.ativo : db.servicos[index].ativo,
          imagemUrl: body.imagemUrl !== undefined ? body.imagemUrl : db.servicos[index].imagemUrl
        };
        await saveDb(db);
        return NextResponse.json(db.servicos[index]);
      }
    }

    // 3. Ação de Cadastrar Novo Serviço
    const novoServico: Servico = {
      id: `srv-${Date.now()}`,
      nome: body.nome,
      descricao: body.descricao || '',
      duracaoMinutos: Number(body.duracaoMinutos || 60),
      precoTotal: Number(body.precoTotal || 0),
      valorSinal: Number(body.valorSinal || 0),
      categoria: body.categoria || 'Geral',
      ativo: body.ativo !== false,
      imagemUrl: body.imagemUrl || ''
    };

    db.servicos.push(novoServico);
    await saveDb(db);
    return NextResponse.json(novoServico, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerenciar serviços' }, { status: 500 });
  }
}
