import { NextResponse } from 'next/server';
import { getDb } from '@/lib/store';

export async function GET() {
  const db = getDb();
  
  // Apenas dados públicos seguros (sem expor credenciais privadas, chaves de API ou segredos)
  const infoPublica = {
    nomeEmpresa: db.configuracoes.nomeEmpresa || "Studio Bella • Estética Especializada",
    telefoneWhatsApp: db.configuracoes.telefoneWhatsApp || "5511999998888",
    horarioAbertura: db.configuracoes.horarioAbertura || "09:00",
    horarioFechamento: db.configuracoes.horarioFechamento || "19:00",
    frete: db.configuracoes.frete,
    mercadoPagoAtivo: db.configuracoes.mercadoPagoAtivo || false,
    servicos: db.servicos.filter(s => s.ativo),
    produtos: db.estoque.filter(e => e.tipo === 'venda_balcao')
  };

  return NextResponse.json(infoPublica);
}
