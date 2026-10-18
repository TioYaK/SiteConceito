import { NextResponse } from 'next/server';
import { getDb, saveDb, Cliente } from '@/lib/store';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.clientes || []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    if (!db.clientes) db.clientes = [];

    // Importação em Lote de Contatos (WhatsApp / CSV / vCard)
    if (body.action === 'importar_lote' && Array.isArray(body.clientes)) {
      const novosCadastrados: Cliente[] = [];
      let duplicadosIgnorados = 0;
      const telefonesExistentes = new Set(
        db.clientes.map(c => c.telefone.replace(/\D/g, ''))
      );

      for (let i = 0; i < body.clientes.length; i++) {
        const item = body.clientes[i];
        if (!item.nome || !item.telefone) continue;

        let telLimpo = item.telefone.replace(/\D/g, '');
        // Adiciona 55 se tiver 10 ou 11 dígitos (DDD + número brasileiro)
        if (telLimpo.length === 10 || telLimpo.length === 11) {
          telLimpo = `55${telLimpo}`;
        }

        if (telefonesExistentes.has(telLimpo)) {
          duplicadosIgnorados++;
          continue;
        }

        telefonesExistentes.add(telLimpo);

        const novo: Cliente = {
          id: `cli-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
          nome: item.nome.trim(),
          telefone: telLimpo,
          instagram: item.instagram?.trim() || '',
          dataNascimento: item.dataNascimento?.trim() || '',
          endereco: item.endereco?.trim() || '',
          cep: item.cep?.trim() || '',
          ultimaVisita: new Date().toISOString().split('T')[0],
          totalAtendimentos: 0,
          totalGasto: 0,
          curvaturaCilios: item.curvaturaCilios || 'D',
          espessuraFios: item.espessuraFios || '0.07',
          estiloMapping: item.estiloMapping || 'Volume Brasileiro',
          alergias: item.alergias || 'Nenhuma',
          observacoes: item.observacoes ? item.observacoes.trim() : 'Importado via lista WhatsApp'
        };

        db.clientes.push(novo);
        novosCadastrados.push(novo);
      }

      await saveDb(db);
      return NextResponse.json({
        sucesso: true,
        totalProcessados: body.clientes.length,
        importados: novosCadastrados.length,
        duplicadosIgnorados,
        clientes: novosCadastrados
      }, { status: 201 });
    }

    // Se for edição
    if (body.id) {
      const idx = db.clientes.findIndex(c => c.id === body.id);
      if (idx !== -1) {
        db.clientes[idx] = { ...db.clientes[idx], ...body };
        await saveDb(db);
        return NextResponse.json(db.clientes[idx]);
      }
    }

    // Se for novo cliente unitário
    let telLimpo = (body.telefone || '').replace(/\D/g, '');
    if (telLimpo.length === 10 || telLimpo.length === 11) {
      telLimpo = `55${telLimpo}`;
    }

    const novoCliente: Cliente = {
      id: `cli-${Date.now()}`,
      nome: body.nome,
      telefone: telLimpo || body.telefone,
      instagram: body.instagram || '',
      dataNascimento: body.dataNascimento || '',
      endereco: body.endereco || '',
      cep: body.cep || '',
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
    await saveDb(db);
    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar cliente' }, { status: 500 });
  }
}
