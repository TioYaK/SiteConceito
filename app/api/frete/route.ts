import { NextResponse } from 'next/server';
import { getDb } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cep, valorCarrinho = 0 } = body;

    if (!cep) {
      return NextResponse.json({ error: 'CEP não informado' }, { status: 400 });
    }

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido. Deve conter 8 dígitos.' }, { status: 400 });
    }

    const db = await getDb();
    const configFrete = db.configuracoes.frete || {
      taxaMotoboy: 15.00,
      cepOrigem: "01310-100",
      cidadeOrigem: "São Paulo",
      estadoOrigem: "SP",
      freteGratisAcimaDe: 150.00,
      permiteRetirada: true,
      permiteMotoboy: true,
      permiteCorreios: true
    };

    // Consulta ViaCEP para obter dados reais de endereço no Brasil
    let dadosEndereco = {
      cep: cleanCep,
      logradouro: '',
      bairro: 'Centro',
      localidade: configFrete.cidadeOrigem,
      uf: configFrete.estadoOrigem
    };

    try {
      const resViaCep = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        next: { revalidate: 3600 }
      });
      const dataViaCep = await resViaCep.json();
      if (!dataViaCep.erro) {
        dadosEndereco = {
          cep: dataViaCep.cep || cleanCep,
          logradouro: dataViaCep.logradouro || '',
          bairro: dataViaCep.bairro || '',
          localidade: dataViaCep.localidade || configFrete.cidadeOrigem,
          uf: dataViaCep.uf || configFrete.estadoOrigem
        };
      }
    } catch (e) {
      console.warn("Falha ao consultar ViaCep, usando estimativa:", e);
    }

    const ehMesmaCidade = dadosEndereco.localidade.toLowerCase() === configFrete.cidadeOrigem.toLowerCase();
    const ehMesmoEstado = dadosEndereco.uf.toUpperCase() === configFrete.estadoOrigem.toUpperCase();

    const opcoes = [];

    // Opção 1: Retirada no Local
    if (configFrete.permiteRetirada) {
      opcoes.push({
        id: 'retirada',
        titulo: 'Retirada no Studio',
        prazo: 'Pronto em 1 hora',
        valor: 0.00,
        gratis: true,
        icone: 'store'
      });
    }

    // Opção 2: Motoboy Express (se for na mesma cidade)
    if (configFrete.permiteMotoboy && ehMesmaCidade) {
      const valorFreteMotoboy = (valorCarrinho >= configFrete.freteGratisAcimaDe) ? 0.00 : configFrete.taxaMotoboy;

      opcoes.push({
        id: 'motoboy',
        titulo: '🛵 Motoboy Express (Mesmo Dia)',
        prazo: 'Entrega hoje (até 3h)',
        valor: valorFreteMotoboy,
        gratis: valorFreteMotoboy === 0,
        icone: 'motoboy'
      });
    }

    // Opção 3: Correios SEDEX / PAC
    if (configFrete.permiteCorreios) {
      // Cálculo dinâmico baseado na localidade
      let valorSedex = 18.50;
      let valorPac = 12.90;
      let prazoSedex = '1 a 2 dias úteis';
      let prazoPac = '4 a 6 dias úteis';

      if (!ehMesmoEstado) {
        valorSedex = 34.00;
        valorPac = 24.50;
        prazoSedex = '2 a 4 dias úteis';
        prazoPac = '7 a 10 dias úteis';
      }

      opcoes.push({
        id: 'sedex',
        titulo: '📦 Sedex dos Correios',
        prazo: prazoSedex,
        valor: valorSedex,
        gratis: false,
        icone: 'package'
      });

      opcoes.push({
        id: 'pac',
        titulo: '🚚 PAC dos Correios',
        prazo: prazoPac,
        valor: valorPac,
        gratis: false,
        icone: 'truck'
      });
    }

    return NextResponse.json({
      endereco: dadosEndereco,
      opcoes
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 });
  }
}
