import { NextResponse } from 'next/server';
import { getDb, saveDb, ItemEstoque } from '@/lib/store';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.estoque);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // 1. Ajuste rápido de quantidade (+ / -)
    if (body.action === 'ajustar_quantidade' && body.id) {
      const item = db.estoque.find(e => e.id === body.id);
      if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
      
      item.quantidade = Math.max(0, item.quantidade + Number(body.delta || 0));
      await saveDb(db);
      return NextResponse.json(item);
    }

    // 2. Exclusão de item
    if (body.action === 'excluir' && body.id) {
      db.estoque = db.estoque.filter(e => e.id !== body.id);
      await saveDb(db);
      return NextResponse.json({ sucesso: true, mensagem: 'Item excluído do estoque' });
    }

    // 3. Edição de item existente
    if ((body.action === 'editar' || body.id) && body.action !== 'novo') {
      const index = db.estoque.findIndex(e => e.id === body.id);
      if (index !== -1) {
        db.estoque[index] = {
          ...db.estoque[index],
          nome: body.nome ?? db.estoque[index].nome,
          quantidade: body.quantidade !== undefined ? Number(body.quantidade) : db.estoque[index].quantidade,
          minimoAlerta: body.minimoAlerta !== undefined ? Number(body.minimoAlerta) : db.estoque[index].minimoAlerta,
          custoUnitario: body.custoUnitario !== undefined ? Number(body.custoUnitario) : db.estoque[index].custoUnitario,
          precoVenda: body.precoVenda !== undefined ? (body.precoVenda ? Number(body.precoVenda) : undefined) : db.estoque[index].precoVenda,
          tipo: body.tipo ?? db.estoque[index].tipo,
          categoria: body.categoria ?? db.estoque[index].categoria,
          descricao: body.descricao ?? db.estoque[index].descricao,
          beneficios: body.beneficios ?? db.estoque[index].beneficios,
          modoUso: body.modoUso ?? db.estoque[index].modoUso,
          imagemUrl: body.imagemUrl !== undefined ? body.imagemUrl : db.estoque[index].imagemUrl
        };
        await saveDb(db);
        return NextResponse.json(db.estoque[index]);
      }
    }

    // 4. Cadastro de novo produto / insumo
    const novoItem: ItemEstoque = {
      id: `est-${Date.now()}`,
      nome: body.nome,
      quantidade: Number(body.quantidade || 0),
      minimoAlerta: Number(body.minimoAlerta || 2),
      custoUnitario: Number(body.custoUnitario || 0),
      precoVenda: body.precoVenda ? Number(body.precoVenda) : undefined,
      tipo: body.tipo || 'insumo_uso',
      categoria: body.categoria || undefined,
      descricao: body.descricao || undefined,
      beneficios: body.beneficios || undefined,
      modoUso: body.modoUso || undefined,
      imagemUrl: body.imagemUrl || undefined
    };

    db.estoque.push(novoItem);
    await saveDb(db);
    return NextResponse.json(novoItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no estoque' }, { status: 500 });
  }
}
