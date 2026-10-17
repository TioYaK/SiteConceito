import { NextResponse } from 'next/server';
import { getDb, saveDb, Cliente } from '@/lib/store';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.clientes || []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    if (!db.clientes) db.clientes = [];

    // Se for edição
    if (body.id) {
      const idx = db.clientes.findIndex(c => c.id === body.id);
      if (idx !== -1) {
        db.clientes[idx] = { ...db.clientes[idx], ...body };
        saveDb(db);
        return NextResponse.json(db.clientes[idx]);
      }
    }

    // Se for novo cliente
    const novoCliente: Cliente = {
      id: `cli-${Date.now()}`,
      nome: body.nome,
      telefone: body.telefone,
      instagram: body.instagram || '',
      dataNascimento: body.dataNascimento || '',
      ultimaVisita: new Date().toISOString().split('T')[0],
      totalAtendimentos: 1,
      totalGasto: Number(body.totalGasto || 0),
      curvaturaCilios: body.curvaturaCilios || 'D',
      espessuraFios: body.espessuraFios || '0.07',
      estiloMapping: body.estiloMapping || 'Volume Brasileiro',
      alergias: body.alergias || 'Nenhuma',
      observacoes: body.observacoes || ''
    };

    db.clientes.push(novoCliente);
    saveDb(db);
    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar cliente' }, { status: 500 });
  }
}
