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

    // Se for ajuste de quantidade
    if (body.action === 'ajustar_quantidade' && body.id) {
      const item = db.estoque.find(e => e.id === body.id);
      if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
      
      item.quantidade = Math.max(0, item.quantidade + Number(body.delta || 0));
      await saveDb(db);
      return NextResponse.json(item);
    }

    // Se for novo produto
    const novoItem: ItemEstoque = {
      id: `est-${Date.now()}`,
      nome: body.nome,
      quantidade: Number(body.quantidade || 0),
      minimoAlerta: Number(body.minimoAlerta || 2),
      custoUnitario: Number(body.custoUnitario || 0),
      precoVenda: body.precoVenda ? Number(body.precoVenda) : undefined,
      tipo: body.tipo || 'insumo_uso'
    };

    db.estoque.push(novoItem);
    await saveDb(db);
    return NextResponse.json(novoItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no estoque' }, { status: 500 });
  }
}
