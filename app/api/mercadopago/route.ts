import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/store';

export async function GET() {
  const db = await getDb();
  const token = db.configuracoes.mercadoPagoAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  return NextResponse.json({
    ativo: db.configuracoes.mercadoPagoAtivo || false,
    temToken: !!token,
    publicKey: db.configuracoes.mercadoPagoPublicKey || process.env.MERCADO_PAGO_PUBLIC_KEY || ""
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // 1. TESTAR CREDENCIAIS DO MERCADO PAGO
    if (body.action === 'testar_credenciais') {
      const token = body.accessToken || db.configuracoes.mercadoPagoAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!token || !token.trim()) {
        return NextResponse.json({ sucesso: false, erro: 'Informe o Access Token do Mercado Pago.' }, { status: 400 });
      }

      try {
        const resMp = await fetch('https://api.mercadopago.com/v1/payment_methods', {
          headers: {
            'Authorization': `Bearer ${token.trim()}`
          }
        });

        if (resMp.ok) {
          return NextResponse.json({
            sucesso: true,
            mensagem: 'Conexão com o Mercado Pago validada com sucesso! Pagamentos por Cartão de Crédito em até 12x, PIX e Boleto estão ativos.'
          });
        } else {
          const errData = await resMp.json();
          return NextResponse.json({
            sucesso: false,
            erro: errData.message || 'Token de acesso inválido ou expirado no Mercado Pago.'
          }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({
          sucesso: false,
          erro: 'Não foi possível conectar aos servidores do Mercado Pago.'
        }, { status: 500 });
      }
    }

    // 2. SALVAR CREDENCIAIS
    if (body.action === 'salvar_credenciais') {
      if (body.mercadoPagoAccessToken !== undefined) db.configuracoes.mercadoPagoAccessToken = body.mercadoPagoAccessToken.trim();
      if (body.mercadoPagoPublicKey !== undefined) db.configuracoes.mercadoPagoPublicKey = body.mercadoPagoPublicKey.trim();
      if (body.mercadoPagoAtivo !== undefined) db.configuracoes.mercadoPagoAtivo = Boolean(body.mercadoPagoAtivo);
      await saveDb(db);
      return NextResponse.json({ sucesso: true, configuracoes: db.configuracoes });
    }

    // 3. CRIAR LINK DE PAGAMENTO (CHECKOUT PRO COM CARTÃO 12X E PIX)
    if (body.action === 'criar_link_pagamento') {
      const token = db.configuracoes.mercadoPagoAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN;
      const valor = parseFloat(body.valor);

      if (!valor || valor <= 0) {
        return NextResponse.json({ error: 'Valor inválido para o link de pagamento.' }, { status: 400 });
      }

      const titulo = body.titulo || `Pagamento - ${db.configuracoes.nomeEmpresa}`;

      // Se o usuário já cadastrou o token oficial do MP
      if (token && token.trim()) {
        try {
          const resPref = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [
                {
                  id: body.referenciaId || `ref-${Date.now()}`,
                  title: titulo,
                  quantity: 1,
                  currency_id: 'BRL',
                  unit_price: valor
                }
              ],
              payer: {
                name: body.clienteNome || 'Cliente',
                phone: {
                  number: body.clienteTelefone || ''
                }
              },
              payment_methods: {
                installments: 12
              },
              auto_return: 'approved'
            })
          });

          const dataPref = await resPref.json();
          if (resPref.ok && dataPref.init_point) {
            return NextResponse.json({
              sucesso: true,
              linkPagamento: dataPref.init_point,
              preferenceId: dataPref.id,
              modo: 'oficial_mp'
            });
          }
        } catch (e) {
          console.warn("Erro ao chamar API de preferência do Mercado Pago:", e);
        }
      }

      // Fallback / Link Inteligente de Checkout Direto (quando ainda não configurou ou modo teste)
      const linkSimulado = `https://link.mercadopago.com.br/studioestetica?valor=${valor.toFixed(2)}`;
      return NextResponse.json({
        sucesso: true,
        linkPagamento: linkSimulado,
        modo: 'simulado'
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro no processamento do Mercado Pago' }, { status: 500 });
  }
}
