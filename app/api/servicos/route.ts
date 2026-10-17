import { NextResponse } from 'next/server';
import { getDb, saveDb, Servico } from '@/lib/store';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.servicos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();

    const novoServico: Servico = {
      id: `srv-${Date.now()}`,
      nome: body.nome,
      descricao: body.descricao || '',
      duracaoMinutos: Number(body.duracaoMinutos || 60),
      precoTotal: Number(body.precoTotal || 0),
      valorSinal: Number(body.valorSinal || 0),
      categoria: body.categoria || 'Geral',
      ativo: body.ativo !== false
    };

    db.servicos.push(novoServico);
    saveDb(db);
    return NextResponse.json(novoServico, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar serviço' }, { status: 500 });
  }
}
