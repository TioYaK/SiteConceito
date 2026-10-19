import { NextResponse } from 'next/server';
import { getDb, saveDb, Agendamento, Servico, Pedido, AppData } from '@/lib/store';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gerador de Chave PIX Copia e Cola Oficial (Padrão Banco Central do Brasil / EMVCo)
 * Inclui cálculo matemático real de CRC16-CCITT (Polinômio 0x1021)
 */
function gerarPixCopiaECola(
  chave: string,
  nomeRecebedor: string,
  cidade: string,
  valor: number,
  txid: string = '***'
): string {
  const chaveLimpa = (chave || '67996203089').trim();
  const nomeLimpo = (nomeRecebedor || 'Studio Bruna Meireles')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .substring(0, 25);

  const cidadeLimpa = (cidade || 'SAO PAULO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .substring(0, 15) || 'SAO PAULO';

  const valorFormatado = valor.toFixed(2);

  const tlv = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo = 
    tlv('00', 'br.gov.bcb.pix') + 
    tlv('01', chaveLimpa);

  const additionalData = tlv('05', txid || '***');

  const payloadSemCrc = 
    tlv('00', '01') + 
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') + 
    tlv('53', '986') + 
    tlv('54', valorFormatado) + 
    tlv('58', 'BR') + 
    tlv('59', nomeLimpo) + 
    tlv('60', cidadeLimpa) + 
    tlv('62', additionalData) +
    '6304';

  let crc = 0xFFFF;
  for (let i = 0; i < payloadSemCrc.length; i++) {
    crc ^= payloadSemCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }

  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${payloadSemCrc}${crcHex}`;
}

async function gerarRespostaGemini(
  mensagem: string,
  clienteNome: string,
  db: AppData,
  apiKey: string,
  modeloNome: string = 'gemini-3.8-flash',
  clienteTelefone: string = '5511999998888',
  historico: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<{ respostaBot: string; agendamentoCriado: Agendamento | null; pedidoCriado?: Pedido | null } | null> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelosParaTentar = Array.from(new Set([
    modeloNome,
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ]));

  const agora = new Date();
  const horaAtualStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const dataAtualFormatada = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  const hojeStr = agora.toISOString().split('T')[0];
  const dAmanha = new Date(agora);
  dAmanha.setDate(dAmanha.getDate() + 1);
  const amanhaStr = dAmanha.toISOString().split('T')[0];

  const servicos = db.servicos.filter(s => s.ativo);
  const produtos = (db.estoque || []).filter(e => e.tipo === 'venda_balcao' && e.quantidade > 0);
  const agendamentosOcupadosHoje = (db.agendamentos || [])
    .filter(a => a.data === hojeStr && a.status !== 'cancelado')
    .map(a => `${a.horario} (${a.servicoNome})`);

  const agendamentosOcupadosAmanha = (db.agendamentos || [])
    .filter(a => a.data === amanhaStr && a.status !== 'cancelado')
    .map(a => `${a.horario} (${a.servicoNome})`);

  const frete = db.configuracoes.frete || {
    taxaMotoboy: 15.0,
    cepOrigem: "01304-001",
    cidadeOrigem: "São Paulo",
    estadoOrigem: "SP",
    freteGratisAcimaDe: 150.0
  };

  const endereco = db.configuracoes.endereco || {
    logradouro: "Rua Augusta",
    numero: "1500",
    complemento: "Sala 32",
    bairro: "Consolação",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01304-001",
    pontoReferencia: "Próximo à estação Consolação do Metrô (Linha Verde)",
    linkMaps: "https://maps.google.com/?q=Rua+Augusta,+1500+-+Consola%C3%A7%C3%A3o,+S%C3%A3o+Paulo+-+SP"
  };

  const promptSistema = `
Você é a Manu, recepcionista virtual inteligente, simpática e concierge de beleza do '${db.configuracoes.nomeEmpresa}'.
Momento atual em São Paulo: ${dataAtualFormatada}, às ${horaAtualStr} (horário de Brasília).
Horário de atendimento do Studio: das ${db.configuracoes.horarioAbertura} às ${db.configuracoes.horarioFechamento}.

REGRAS CRÍTICAS DE AGENDAMENTO (ATENÇÃO MÁXIMA):
1. SE A CLIENTE DISSER APENAS "quero agendar", "agendar procedimento", "tem horário?", OU AINDA NÃO ESCOLHEU O PROCEDIMENTO:
   - Defina "acao": "nenhuma".
   - Responda com muito carinho e simpatia: diga que será um prazer atendê-la e apresente os procedimentos disponíveis:
     • Extensão de Cílios (Volume / Fio a Fio)
     • Design de Sobrancelhas com Henna
     • Brow Lamination
     • Micropigmentação de Sobrancelhas
     • Limpeza de Pele Profunda
   - Pergunte qual deles ela deseja e para qual dia da semana e período (manhã ou tarde) ela prefere.
   - NUNCA assuma um procedimento por conta própria!
   - NUNCA crie agendamento nem peça sinal PIX neste momento!

2. SE A CLIENTE ESCOLHEU O PROCEDIMENTO MAS AINDA NÃO DEFINIU DATA E HORÁRIO:
   - Defina "acao": "nenhuma".
   - Confirme o procedimento com entusiasmo, mencione a duração e o valor, e pergunte qual dia e horário ela prefere dentro do expediente (${db.configuracoes.horarioAbertura} às ${db.configuracoes.horarioFechamento}).
   - Se já passou do horário de atendimento hoje (agora são ${horaAtualStr}), ofereça horários a partir de amanhã! NUNCA ofereça horários no passado para hoje!

3. APENAS CRIE O AGENDAMENTO ("acao": "criar_agendamento") QUANDO:
   - O procedimento específico estiver claro e confirmado pela cliente.
   - O dia específico estiver definido (amanhã, hoje caso ainda haja tempo no expediente, ou data futura).
   - O horário específico estiver definido dentro do expediente comercial.
   - Nesses casos, defina:
     "acao": "criar_agendamento",
     "dadosAgendamento": {
       "servicoId": "id_do_servico",
       "data": "YYYY-MM-DD",
       "horario": "HH:MM"
     }
     Avise com carinho que o horário provisório foi separado e explique sobre o sinal de reserva.

ENDEREÇO FÍSICO DO STUDIO:
- Logradouro: ${endereco.logradouro}, nº ${endereco.numero} ${endereco.complemento ? `(${endereco.complemento})` : ''}
- Bairro: ${endereco.bairro} - ${endereco.cidade}/${endereco.estado} (CEP: ${endereco.cep})
- Ponto de Referência: ${endereco.pontoReferencia || 'Próximo ao metrô'}
- Como chegar / Google Maps: ${endereco.linkMaps || 'https://maps.google.com'}
- Se a cliente perguntar onde fica o studio, qual o endereço, como chegar, localização ou ponto de referência: passe o endereço exato com carinho e o link do Google Maps para ela traçar a rota!

HORÁRIOS JÁ OCUPADOS:
- Hoje (${hojeStr}): ${agendamentosOcupadosHoje.length > 0 ? agendamentosOcupadosHoje.join(', ') : 'Todos os horários livres'}
- Amanhã (${amanhaStr}): ${agendamentosOcupadosAmanha.length > 0 ? agendamentosOcupadosAmanha.join(', ') : 'Todos os horários livres'}

PERSONALIDADE & TOM DE VOZ:
- Extremamente simpática, acolhedora, humana e elegante.
- Use emojis suaves e bonitos (✨, 🌸, 💖, 🗓️, 🛵, 🛍️).
- Fale em português brasileiro de forma natural, ágil e prestativa.
- Trate sempre a cliente pelo nome (${clienteNome}).

SERVIÇOS OFERECIDOS (CATÁLOGO FECHADO - NUNCA INVENTE OUTROS):
${JSON.stringify(servicos.map(s => ({ id: s.id, nome: s.nome, preco: s.precoTotal, sinal: s.valorSinal, duracao: `${s.duracaoMinutos} min`, descricao: s.descricao })))}

PRODUTOS HOME-CARE DISPONÍVEIS PARA VENDA (APRESENTE COM CARINHO E EXPLIQUE OS BENEFÍCIOS):
${JSON.stringify(produtos.map(p => ({
  id: p.id,
  nome: p.nome,
  preco: p.precoVenda,
  categoria: p.categoria || 'Cuidados Diários',
  descricao: p.descricao || '',
  beneficios: p.beneficios || '',
  modoUso: p.modoUso || '',
  estoque: p.quantidade
})))}

FORMAS DE PAGAMENTO ACEITAS:
- PIX à vista (chave oficial: ${db.configuracoes.chavePix})
- Cartão de Crédito em até 12x (online via Mercado Pago ou na maquininha do studio no dia do atendimento)

REGRAS DE ENTREGA E FRETE:
- Retirada no Studio: GRÁTIS (${endereco.logradouro}, nº ${endereco.numero}, pronta em 1 hora).
- Motoboy Express: R$ ${frete.taxaMotoboy.toFixed(2)} (mesmo dia para ${frete.cidadeOrigem}), ou GRÁTIS em compras acima de R$ ${frete.freteGratisAcimaDe.toFixed(2)}.
- Sedex / PAC dos Correios para outras cidades/estados.

CHAVE PIX DO STUDIO:
- Chave: ${db.configuracoes.chavePix} (${db.configuracoes.tipoChavePix})

TRAVAS DE SEGURANÇA E PRECISÃO ABSOLUTA (BLINDAGEM CONTRA ERROS):
1. CATÁLOGO FECHADO:
   - Somos especialistas EXCLUSIVAS em Cílios, Sobrancelhas e Limpeza de Pele Profunda.
   - NUNCA invente, ofereça ou agende: corte de cabelo, manicure/unhas em gel, depilação a laser, botox, preenchimento labial, massagens ou procedimentos médicos.
2. DISTINÇÃO CLARA ENTRE SERVIÇO E PRODUTO:
   - SERVIÇOS: Exigem horário na agenda e sinal PIX para travar o horário.
   - PRODUTOS: Cuidados para casa (entrega por motoboy ou retirada).
3. ZERO DESCONTO ARBITRÁRIO: Nossos preços são estritamente os da tabela.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON puro):
{
  "respostaWhatsApp": "Texto humanizado e formatado para o WhatsApp...",
  "acao": "nenhuma" | "criar_agendamento" | "criar_pedido_produto",
  "dadosAgendamento": {
    "servicoId": "id_do_servico",
    "data": "YYYY-MM-DD",
    "horario": "HH:MM"
  },
  "dadosPedido": {
    "produtoId": "id_do_produto",
    "quantidade": 1,
    "tipoEntrega": "motoboy" | "retirada" | "correios",
    "cep": "00000-000",
    "endereco": "Rua..."
  },
  "dadosCliente": {
    "nomeCompleto": "Nome Completo",
    "dataNascimento": "DD/MM ou YYYY-MM-DD",
    "endereco": "Rua, número, bairro",
    "cep": "00000-000"
  }
}
`;

  for (const m of modelosParaTentar) {
    try {
      const model = genAI.getGenerativeModel({
        model: m,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
        systemInstruction: promptSistema,
      });

      let formattedHistory: any[] = [];
      if (Array.isArray(historico) && historico.length > 0) {
        formattedHistory = historico
          .filter(h => h && h.text && h.text.trim())
          .map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.text }]
          }));

        while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
          formattedHistory.shift();
        }
      }

      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(`Mensagem da cliente ${clienteNome}: "${mensagem}"`);
      const textoJson = result.response.text();
      const parsed = JSON.parse(textoJson);

      let agendamentoCriado: Agendamento | null = null;
      let pedidoCriado: Pedido | null = null;
      let respostaFinal = parsed.respostaWhatsApp || "";

      // Se a IA decidiu criar um agendamento
      if (parsed.acao === 'criar_agendamento' && parsed.dadosAgendamento?.servicoId) {
        const srv = servicos.find(s => s.id === parsed.dadosAgendamento.servicoId) || servicos[0];
        const dataAg = parsed.dadosAgendamento.data || hojeStr;
        const horarioAg = parsed.dadosAgendamento.horario || "14:00";
        const chavePixOficial = db.configuracoes.chavePix || clienteTelefone || '67996203089';

        const pixCode = gerarPixCopiaECola(
          chavePixOficial,
          db.configuracoes.nomeEmpresa,
          db.configuracoes.endereco?.cidade || 'SAO PAULO',
          srv.valorSinal
        );

        agendamentoCriado = {
          id: `ag-${Date.now()}`,
          clienteNome,
          clienteTelefone: clienteTelefone || "5511999998888",
          servicoId: srv.id,
          servicoNome: srv.nome,
          data: dataAg,
          horario: horarioAg,
          duracaoMinutos: srv.duracaoMinutos,
          valorTotal: srv.precoTotal,
          valorSinal: srv.valorSinal,
          sinalPago: false,
          status: 'aguardando_sinal',
          pixCodigo: pixCode,
          criadoVia: 'whatsapp_ia',
          createdAt: new Date().toISOString()
        };

        db.agendamentos.push(agendamentoCriado);
        await saveDb(db);

        if (!respostaFinal.includes(pixCode)) {
          respostaFinal += `\n\n🔑 *Chave PIX (${db.configuracoes.tipoChavePix || 'Telefone'}):* ${chavePixOficial}\n📋 *PIX Copia e Cola:*\n\`${pixCode}\``;
        }
      }

      // Se a IA decidiu criar um pedido de produto
      if (parsed.acao === 'criar_pedido_produto' && parsed.dadosPedido?.produtoId) {
        const prod = produtos.find(p => p.id === parsed.dadosPedido.produtoId) || produtos[0];
        const qtd = parsed.dadosPedido.quantidade || 1;
        const tipoEntrega = parsed.dadosPedido.tipoEntrega || 'motoboy';
        const valorItens = (prod.precoVenda || 45.0) * qtd;
        const valorFrete = tipoEntrega === 'motoboy' ? (valorItens >= frete.freteGratisAcimaDe ? 0 : frete.taxaMotoboy) : tipoEntrega === 'correios' ? 18.50 : 0.0;
        const valorTotal = valorItens + valorFrete;
        const chavePixOficial = db.configuracoes.chavePix || clienteTelefone || '67996203089';

        const pixCode = gerarPixCopiaECola(
          chavePixOficial,
          db.configuracoes.nomeEmpresa,
          db.configuracoes.endereco?.cidade || 'SAO PAULO',
          valorTotal
        );

        if (!db.pedidos) db.pedidos = [];
        pedidoCriado = {
          id: `ped-${Date.now()}`,
          clienteNome,
          clienteTelefone: clienteTelefone || "5511999998888",
          itens: [{ produtoId: prod.id, nome: prod.nome, quantidade: qtd, precoUnitario: prod.precoVenda || 45.0 }],
          tipoEntrega,
          endereco: parsed.dadosPedido.endereco || '',
          cep: parsed.dadosPedido.cep || '',
          valorItens,
          valorFrete,
          valorTotal,
          status: 'aguardando_pix',
          pixCodigo: pixCode,
          pago: false,
          createdAt: new Date().toISOString()
        };

        prod.quantidade = Math.max(0, prod.quantidade - qtd);
        db.pedidos.unshift(pedidoCriado);
        await saveDb(db);

        if (!respostaFinal.includes(pixCode)) {
          respostaFinal += `\n\n🔑 *Chave PIX (${db.configuracoes.tipoChavePix || 'Telefone'}):* ${chavePixOficial}\n📋 *PIX Copia e Cola:*\n\`${pixCode}\``;
        }
      }

      // Se a IA extraiu dados cadastrais (Nome Completo, Aniversário, Endereço):
    if (parsed.dadosCliente || agendamentoCriado || pedidoCriado) {
      if (!db.clientes) db.clientes = [];
      const nomeIdentificado = parsed.dadosCliente?.nomeCompleto || clienteNome;
      const dataNascIdentificada = parsed.dadosCliente?.dataNascimento || '';
      const enderecoIdentificado = parsed.dadosCliente?.endereco || parsed.dadosPedido?.endereco || '';
      const cepIdentificado = parsed.dadosCliente?.cep || parsed.dadosPedido?.cep || '';

      const clienteExistente = db.clientes.find(c =>
        (clienteTelefone && c.telefone.replace(/\D/g, '') === clienteTelefone.replace(/\D/g, '')) ||
        c.nome.toLowerCase() === nomeIdentificado.toLowerCase() ||
        c.nome.toLowerCase() === clienteNome.toLowerCase()
      );

      if (clienteExistente) {
        if (parsed.dadosCliente?.nomeCompleto) clienteExistente.nome = parsed.dadosCliente.nomeCompleto;
        if (clienteTelefone) clienteExistente.telefone = clienteTelefone;
        if (dataNascIdentificada) clienteExistente.dataNascimento = dataNascIdentificada;
        if (enderecoIdentificado) clienteExistente.endereco = enderecoIdentificado;
        if (cepIdentificado) clienteExistente.cep = cepIdentificado;
        if (agendamentoCriado) clienteExistente.totalAtendimentos = (clienteExistente.totalAtendimentos || 0) + 1;
        if (pedidoCriado) clienteExistente.totalGasto = (clienteExistente.totalGasto || 0) + pedidoCriado.valorTotal;
        await saveDb(db);
      } else if (nomeIdentificado && (dataNascIdentificada || enderecoIdentificado || agendamentoCriado || pedidoCriado)) {
        db.clientes.unshift({
          id: `cli-${Date.now()}`,
          nome: nomeIdentificado,
          telefone: clienteTelefone || "5511999998888",
          dataNascimento: dataNascIdentificada,
          endereco: enderecoIdentificado,
          cep: cepIdentificado,
          ultimaVisita: hojeStr,
          totalAtendimentos: agendamentoCriado ? 1 : 0,
          totalGasto: agendamentoCriado ? agendamentoCriado.valorTotal : (pedidoCriado ? pedidoCriado.valorTotal : 0),
          observacoes: `Cadastrada via WhatsApp com Manu (IA). Aniversário: ${dataNascIdentificada || 'Pendente'}`
        });
        await saveDb(db);
      }
    }

    return {
      respostaBot: respostaFinal,
      agendamentoCriado,
      pedidoCriado
    };
  } catch (error) {
    console.warn(`Tentativa com modelo ${m} falhou:`, error);
  }
}
return null;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarReal(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

async function gerarRespostaRecepcionista(
  mensagem: string,
  clienteNome: string,
  db: AppData,
  clienteTelefone: string = "5511999998888"
): Promise<{ respostaBot: string; agendamentoCriado: Agendamento | null; pedidoCriado?: Pedido | null }> {
  const clean = normalizar(mensagem);
  const servicos = db.servicos.filter(s => s.ativo);
  const produtosVenda = (db.estoque || []).filter(e => e.tipo === 'venda_balcao' && e.quantidade > 0);

  // Mapear serviços citados
  const servicosMencionados = servicos.filter(s => {
    const sNome = normalizar(s.nome);

    if ((clean.includes('limpeza') || clean.includes('pele') || clean.includes('cravo')) && sNome.includes('limpeza')) return true;
    if ((clean.includes('cilio') || clean.includes('fio a fio') || clean.includes('volume') || clean.includes('extensao')) && sNome.includes('cilio')) return true;
    if ((clean.includes('brow') || clean.includes('lamination')) && sNome.includes('brow')) return true;
    if ((clean.includes('micro') || clean.includes('pigmentacao') || clean.includes('shadow')) && sNome.includes('micro')) return true;
    if ((clean.includes('sobrancelha') || clean.includes('henna') || clean.includes('design') || clean.includes('designer')) && sNome.includes('sobrancelha')) return true;
    return false;
  });

  // Mapear produtos para venda citados
  const produtosMencionados = produtosVenda.filter(p => {
    const pNome = normalizar(p.nome);
    if ((clean.includes('espuma') || clean.includes('higienizadora') || clean.includes('shampoo')) && pNome.includes('espuma')) return true;
    if ((clean.includes('serum') || clean.includes('oleo') || clean.includes('reparador') || clean.includes('fortalecedor')) && (pNome.includes('serum') || pNome.includes('oleo'))) return true;
    return false;
  });

  // 0. CONSULTA DE ENDEREÇO / LOCALIZAÇÃO (ex: "onde fica o estúdio?", "qual o endereço?", "como chego aí?")
  const ehPerguntaEndereco = 
    clean.includes('onde fica') || 
    clean.includes('qual o endereco') || 
    clean.includes('qual endereco') ||
    clean.includes('como chego') || 
    clean.includes('localizacao') || 
    clean.includes('ponto de referencia') || 
    clean.includes('onde voces estao') || 
    clean.includes('qual a rua') ||
    clean.includes('onde e o studio') ||
    clean.includes('qual o ponto') ||
    clean.includes('perto de onde');

  if (ehPerguntaEndereco) {
    const end = db.configuracoes.endereco || {
      logradouro: "Rua Augusta",
      numero: "1500",
      complemento: "Sala 32",
      bairro: "Consolação",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01304-001",
      pontoReferencia: "Próximo à estação Consolação do Metrô",
      linkMaps: "https://maps.google.com/?q=Rua+Augusta,+1500+-+Consola%C3%A7%C3%A3o,+S%C3%A3o+Paulo+-+SP"
    };

    const ref = end.pontoReferencia ? `\n📍 *Ponto de referência:* ${end.pontoReferencia}` : '';
    const maps = end.linkMaps ? `\n🗺️ *Ver no Google Maps:* ${end.linkMaps}` : '';

    return {
      respostaBot: `Olá, ${clienteNome}! 🌸 O *${db.configuracoes.nomeEmpresa}* fica localizado em um espaço super confortável, sofisticado e seguro:\n\n🏢 *Endereço:* ${end.logradouro}, nº ${end.numero} ${end.complemento ? `(${end.complemento})` : ''}\n🏙️ *Bairro:* ${end.bairro} - ${end.cidade}/${end.estado} (CEP: ${end.cep})${ref}${maps}\n\nAtendemos de segunda a sábado das ${db.configuracoes.horarioAbertura} às ${db.configuracoes.horarioFechamento} com horário reservado. Gostaria de marcar um horário para vir nos conhecer? ✨`,
      agendamentoCriado: null
    };
  }

  // 1. CONSULTA DE FRETE / CEP (ex: "quanto é o frete pro CEP 01304-001?", "calcula frete 04538133")
  const matchCep = clean.match(/\b\d{5}-?\d{3}\b/);
  if (matchCep || ((clean.includes('frete') || clean.includes('entrega') || clean.includes('motoboy')) && clean.includes('cep'))) {
    const cepEncontrado = matchCep ? matchCep[0] : 'seu CEP';
    const taxaMotoboy = db.configuracoes.frete?.taxaMotoboy || 15.00;
    const end = db.configuracoes.endereco;
    const localRetirada = end ? `${end.logradouro}, nº ${end.numero}` : 'Rua Augusta, 1500';

    return {
      respostaBot: `Olá, ${clienteNome}! 🛵✨ Consultei para o CEP *${cepEncontrado}*:\n\n1️⃣ *🛵 Motoboy Express (Mesmo Dia):* R$ ${formatarReal(taxaMotoboy)} (entrega hoje até as 18h no seu endereço)\n2️⃣ *📦 Sedex Correios:* R$ 18,50 (1 a 2 dias úteis)\n3️⃣ *🏪 Retirada no Studio:* *GRÁTIS* (${localRetirada}, pronto em 1 hora)\n\nQual dessas opções você prefere para o seu pedido?`,
      agendamentoCriado: null
    };
  }

  // 2. PEDIDO DE PRODUTOS / VENDA VIA WHATSAPP (ex: "Vocês vendem espuma?", "Quero comprar o sérum", "Tem produto pra levar?")
  const ehPerguntaProduto = 
    clean.includes('espuma') || 
    clean.includes('serum') || 
    clean.includes('comprar') || 
    clean.includes('vende') || 
    clean.includes('produto') || 
    clean.includes('home care') ||
    clean.includes('levar pra casa');

  if (ehPerguntaProduto && !clean.includes('marcar') && !clean.includes('agendar')) {
    // Se a cliente já escolheu um método de entrega (ex: "quero a espuma por motoboy" ou "quero retirar a espuma")
    if ((clean.includes('motoboy') || clean.includes('retirar') || clean.includes('correios') || clean.includes('sedex')) && produtosMencionados.length > 0) {
      const prod = produtosMencionados[0];
      const tipoEntrega = clean.includes('motoboy') ? 'motoboy' : clean.includes('retirar') ? 'retirada' : 'correios';
      const valorFrete = tipoEntrega === 'motoboy' ? (db.configuracoes.frete?.taxaMotoboy || 15.00) : tipoEntrega === 'correios' ? 18.50 : 0.00;
      const valorTotal = (prod.precoVenda || 45.00) + valorFrete;

      const pixCode = `00020126360014BR.GOV.BCB.PIX0111${db.configuracoes.chavePix}5204000053039865405${valorTotal.toFixed(2)}5802BR5925${db.configuracoes.nomeEmpresa.substring(0, 25)}6009SAO PAULO62070503***6304${Math.floor(1000 + Math.random() * 9000)}`;

      if (!db.pedidos) db.pedidos = [];
      const novoPedido: Pedido = {
        id: `ped-${Date.now()}`,
        clienteNome,
        clienteTelefone: clienteTelefone || "5511999998888",
        itens: [{ produtoId: prod.id, nome: prod.nome, quantidade: 1, precoUnitario: prod.precoVenda || 45.00 }],
        tipoEntrega,
        valorItens: prod.precoVenda || 45.00,
        valorFrete,
        valorTotal,
        status: 'aguardando_pix',
        pixCodigo: pixCode,
        pago: false,
        createdAt: new Date().toISOString()
      };

      db.pedidos.unshift(novoPedido);
      saveDb(db);

      const entregaTexto = tipoEntrega === 'motoboy' 
        ? '🛵 Entrega via Motoboy Express (Mesmo Dia)' 
        : tipoEntrega === 'retirada' 
        ? '🏪 Retirada no Studio (Pronto em 1h)' 
        : '📦 Envio via Sedex Correios';

      return {
        respostaBot: `Perfeito, ${clienteNome}! 🛍️ Pedido registrado com sucesso:\n\n• *1x ${prod.nome}*: R$ ${formatarReal(prod.precoVenda || 45)}\n• *Frete:* ${entregaTexto} ${valorFrete > 0 ? `(R$ ${formatarReal(valorFrete)})` : '(*GRÁTIS*)'}\n\n💰 *Total do Pedido: R$ ${formatarReal(valorTotal)}*\n\n🔑 *Chave PIX (Copia e Cola):*\n\`${pixCode}\`\n\nAssim que fizer o PIX, me mande o comprovante e seu endereço completo aqui para o envio imediato! ✨📦`,
        agendamentoCriado: null,
        pedidoCriado: novoPedido
      };
    }

    // Se perguntou quais produtos temos ou o valor de algum
    if (produtosMencionados.length > 0) {
      const prod = produtosMencionados[0];
      return {
        respostaBot: `Temos sim, ${clienteNome}! ✨ Nosso produto de maior sucesso é a *${prod.nome}* por *R$ ${formatarReal(prod.precoVenda || 45)}*! 💖\n\nEla é formulada com pH neutro para limpar os fios sem arder os olhos e faz a extensão durar até 2x mais tempo!\n\nVocê prefere:\n1️⃣ *Retirar aqui no Studio* (sem frete)\n2️⃣ *Receber hoje por Motoboy* (se quiser, me passa seu CEP ou bairro para calcular o frete!) 🛵📦`,
        agendamentoCriado: null
      };
    }

    // Catálogo geral de produtos
    const listaProdutos = produtosVenda.map(p => `• *${p.nome}*: R$ ${formatarReal(p.precoVenda || 0)}`).join('\n');
    return {
      respostaBot: `Olá, ${clienteNome}! ✨ Temos uma linha de cuidados profissionais para você levar para casa:\n\n${listaProdutos || '• Espuma Higienizadora Especial de Cílios: R$ 45,00'}\n\nVocê pode *retirar aqui no Studio* ou pedir para *entregar no seu endereço por motoboy/correios*! Gostaria de pedir algum? 🛍️`,
      agendamentoCriado: null
    };
  }

  // 3. DÚVIDA / EXPLICAÇÃO DE PROCEDIMENTOS
  const ehPerguntaExplicativa = 
    clean.includes('o que e') || 
    clean.includes('oq e') || 
    clean.includes('o q e') || 
    clean.includes('como funciona') || 
    clean.includes('como e') ||
    clean.includes('para que serve') ||
    clean.includes('dura quanto') ||
    clean.includes('doi') ||
    clean.includes('explica') ||
    clean.includes('qual a diferenca');

  if (ehPerguntaExplicativa) {
    if (clean.includes('brow') || clean.includes('lamination')) {
      const srv = servicos.find(s => normalizar(s.id).includes('brow') || normalizar(s.nome).includes('brow'));
      return {
        respostaBot: `Olá, ${clienteNome}! ✨ O *Brow Lamination* é uma técnica incrível que alinha e penteia os fios naturais da sobrancelha para cima!\n\nEle cria aquele efeito encorpado, volumoso e moderno (estilo gringa), cobrindo falhas sem precisar de agulhas. O procedimento é super indolor e o efeito dura de 4 a 6 semanas! 😍\n\nO valor é *R$ ${formatarReal(srv?.precoTotal || 120)}* (com design incluso). Quer que eu separe um horário para você experimentar?`,
        agendamentoCriado: null
      };
    }

    if (clean.includes('cilio') || clean.includes('extensao') || clean.includes('alongamento')) {
      const srv = servicos.find(s => normalizar(s.nome).includes('cilio'));
      return {
        respostaBot: `A *Extensão de Cílios* é a colagem de fios sintéticos ultrafinos e levinhos sobre os seus cílios naturais! 👁️💖\n\nO olhar fica preenchido, com curvatura linda e você acorda pronta todos os dias sem precisar de rímel. Não dói nada (é super relaxante!) e dura cerca de 25 a 30 dias.\n\nO valor é *R$ ${formatarReal(srv?.precoTotal || 150)}*. Gostaria de marcar o seu?`,
        agendamentoCriado: null
      };
    }

    if (clean.includes('micro') || clean.includes('pigmentacao')) {
      const srv = servicos.find(s => normalizar(s.nome).includes('micro'));
      return {
        respostaBot: `A *Micropigmentação de Sobrancelhas* é uma técnica semi-permanente que desenha fios ou um sombreado suave para corrigir falhas e dar volume natural às suas sobrancelhas! ✨\n\nUsamos anestésico tópico para garantir que você não sinta dor. O resultado fica muito natural e dura de 12 a 18 meses.\n\nO valor é *R$ ${formatarReal(srv?.precoTotal || 380)}*. Gostaria de agendar uma avaliação?`,
        agendamentoCriado: null
      };
    }

    if (clean.includes('limpeza') || clean.includes('pele')) {
      const srv = servicos.find(s => normalizar(s.nome).includes('limpeza'));
      return {
        respostaBot: `Nossa *Limpeza de Pele Profunda* é completa e super relaxante! 🧖‍♀️🌸\n\nO protocolo inclui: esfoliação profunda, vapor de ozônio, extração sem dor de cravos e miliuns, alta frequência antibacteriana e máscara facial calmante.\n\nA sessão leva 1h15 e o valor é *R$ ${formatarReal(srv?.precoTotal || 130)}*. Sua pele vai respirar de novo! Vamos agendar?`,
        agendamentoCriado: null
      };
    }

    if (clean.includes('sobrancelha') || clean.includes('henna') || clean.includes('design') || clean.includes('designer')) {
      const srv = servicos.find(s => normalizar(s.nome).includes('sobrancelha'));
      return {
        respostaBot: `Nosso *Design de Sobrancelhas com Henna* é feito através de mapeamento facial geométrico, respeitando a harmonia e o formato natural do seu rosto! 📐✨\n\nA aplicação de henna de alta fixação tonaliza a pele e os pelinhos, preenchendo falhas por até 10 dias.\n\nO valor é apenas *R$ ${formatarReal(srv?.precoTotal || 50)}*. Quer agendar para hoje ou amanhã?`,
        agendamentoCriado: null
      };
    }
  }

  // 4. INTENÇÃO DE AGENDAMENTO
  const ehAgendamento = 
    clean.includes('marcar') || 
    clean.includes('agendar') || 
    clean.includes('horario') || 
    clean.includes('vaga') || 
    clean.includes('tem vaga') ||
    clean.includes('segunda') || 
    clean.includes('terca') || 
    clean.includes('quarta') || 
    clean.includes('quinta') || 
    clean.includes('sexta') || 
    clean.includes('sabado') ||
    /\b(0?[89]|1[0-9]|20):[0-5][0-9]\b/.test(clean) ||
    /\b(as|as)\s*(0?[89]|1[0-9]|20)h?\b/.test(clean);

  if (ehAgendamento) {
    // 1. Se a cliente ainda NÃO especificou qual serviço deseja
    if (servicosMencionados.length === 0) {
      const listaSrv = servicos.map(s => `• *${s.nome}* - R$ ${formatarReal(s.precoTotal)} (Sinal R$ ${formatarReal(s.valorSinal)})`).join('\n');
      return {
        respostaBot: `Olá, ${clienteNome}! 🌸 Vai ser um prazer enorme cuidar de você no *${db.configuracoes.nomeEmpresa}*!\n\nQual dos nossos procedimentos você gostaria de agendar?\n\n${listaSrv}\n\nE para qual dia e período (manhã ou tarde) fica melhor para você? ✨🗓️`,
        agendamentoCriado: null
      };
    }

    const servicoEncontrado = servicosMencionados[0];

    // 2. Se a cliente escolheu o serviço, mas ainda NÃO especificou dia ou horário
    const matchHorario = clean.match(/\b(0?[89]|1[0-9]|20):[0-5][0-9]\b/);
    const matchHorasSimples = clean.match(/\b(as)\s*(0?[89]|1[0-9]|20)h?\b/);
    const temHorario = !!(matchHorario || matchHorasSimples);
    const temDia = clean.includes('hoje') || clean.includes('amanha') || clean.includes('segunda') || clean.includes('terca') || clean.includes('quarta') || clean.includes('quinta') || clean.includes('sexta') || clean.includes('sabado') || /\b\d{1,2}\/\d{1,2}\b/.test(clean);

    if (!temHorario || !temDia) {
      return {
        respostaBot: `Maravilha, ${clienteNome}! O procedimento *${servicoEncontrado.nome}* é perfeito! 😍\n\n• *Investimento:* R$ ${formatarReal(servicoEncontrado.precoTotal)} (Sinal de R$ ${formatarReal(servicoEncontrado.valorSinal)})\n• *Duração:* cerca de ${servicoEncontrado.duracaoMinutos} min\n\nNosso horário de atendimento é de segunda a sábado das ${db.configuracoes.horarioAbertura} às ${db.configuracoes.horarioFechamento}. Para qual dia e horário você prefere marcar? 🗓️✨`,
        agendamentoCriado: null
      };
    }

    // 3. Se especificou serviço E data/horário
    let horarioEscolhido = matchHorario ? matchHorario[0] : `${matchHorasSimples![2].padStart(2, '0')}:00`;
    let dataEscolhida = new Date().toISOString().split('T')[0];
    let diaTexto = 'hoje';

    if (clean.includes('amanha')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dataEscolhida = d.toISOString().split('T')[0];
      diaTexto = 'amanhã';
    }

    const chavePixOficial = db.configuracoes.chavePix || clienteTelefone || '67996203089';
    const pixCode = gerarPixCopiaECola(
      chavePixOficial,
      db.configuracoes.nomeEmpresa,
      db.configuracoes.endereco?.cidade || 'SAO PAULO',
      servicoEncontrado.valorSinal
    );

    const novoAgendamento: Agendamento = {
      id: `ag-${Date.now()}`,
      clienteNome,
      clienteTelefone: clienteTelefone || "5511999998888",
      servicoId: servicoEncontrado.id,
      servicoNome: servicoEncontrado.nome,
      data: dataEscolhida,
      horario: horarioEscolhido,
      duracaoMinutos: servicoEncontrado.duracaoMinutos,
      valorTotal: servicoEncontrado.precoTotal,
      valorSinal: servicoEncontrado.valorSinal,
      sinalPago: false,
      status: 'aguardando_sinal',
      pixCodigo: pixCode,
      criadoVia: 'whatsapp_ia',
      observacoes: `Solicitado via WhatsApp: "${mensagem}"`,
      createdAt: new Date().toISOString()
    };

    db.agendamentos.push(novoAgendamento);
    await saveDb(db);

    return {
      respostaBot: `Perfeito, ${clienteNome}! Reservei seu horário provisório para *${servicoEncontrado.nome}* ${diaTexto} às *${horarioEscolhido}*. 🗓️✨\n\nPara garantir a sua vaga na agenda e o tempo exclusivo da profissional, solicitamos o pagamento do sinal de *R$ ${formatarReal(servicoEncontrado.valorSinal)}* (esse valor será abatido do total na sua comanda).\n\n🔑 *Chave PIX (${db.configuracoes.tipoChavePix || 'Telefone'}):* ${chavePixOficial}\n📋 *PIX Copia e Cola:*\n\`${pixCode}\`\n\nAssim que fizer a transferência, nossa confirmação chega aqui em instantes! Te esperamos com muito carinho! 💖`,
      agendamentoCriado: novoAgendamento
    };
  }

  // 5. PERGUNTAS SOBRE VALORES / PREÇOS
  const ehPerguntaPreco = 
    clean.includes('sai') || 
    clean.includes('fica') || 
    clean.includes('custa') || 
    clean.includes('quanto') || 
    clean.includes('valor') || 
    clean.includes('preco') || 
    clean.includes('tabela') || 
    clean.includes('catalogo') || 
    clean.includes('orcamento');

  if (ehPerguntaPreco || servicosMencionados.length > 0) {
    if (servicosMencionados.length > 0) {
      const lista = servicosMencionados.map(s => `• *${s.nome}*: R$ ${formatarReal(s.precoTotal)} (Sinal de R$ ${formatarReal(s.valorSinal)})`).join('\n');
      return {
        respostaBot: `Olá, ${clienteNome}! ✨ Seguem os valores dos procedimentos:\n\n${lista}\n\nLembrando que o sinal é abatido no dia do seu atendimento! Qual desses você quer marcar comigo? Tenho horários vagos hoje e nesta semana! 💕`,
        agendamentoCriado: null
      };
    }

    const listaCompleta = servicos.map(s => `• *${s.nome}*: R$ ${formatarReal(s.precoTotal)} (Sinal de R$ ${formatarReal(s.valorSinal)})`).join('\n');
    return {
      respostaBot: `Olá, ${clienteNome}! Seja muito bem-vinda ao *${db.configuracoes.nomeEmpresa}*! ✨\n\nAqui está nossa tabela de serviços e valores:\n\n${listaCompleta}\n\nQual desses você gostaria de fazer? Me diga um dia e horário bom para você! 🗓️`,
      agendamentoCriado: null
    };
  }

  // 6. SAUDAÇÃO PADRÃO
  return {
    respostaBot: `Olá, ${clienteNome}! Tudo bem? Sou a Manu, recepcionista virtual do *${db.configuracoes.nomeEmpresa}* 🌸.\n\nComo posso te ajudar hoje?\n• Agendar Procedimentos (Cílios, Sobrancelhas, Limpeza de Pele)\n• Tirar dúvidas de valores e técnicas\n• Comprar produtos para cuidados em casa (com entrega ou retirada! 🛍️)`,
    agendamentoCriado: null
  };
}

export async function GET() {
  const db = await getDb();
  const apiKey = db.configuracoes.geminiApiKey || process.env.GEMINI_API_KEY || "";
  return NextResponse.json({
    status: db.configuracoes.statusWhatsApp,
    qrCodeAtual: db.configuracoes.qrCodeAtual || "",
    iaAtiva: db.configuracoes.iaAtiva,
    telefone: db.configuracoes.telefoneWhatsApp,
    prompt: db.configuracoes.promptRecepcionista,
    nomeEmpresa: db.configuracoes.nomeEmpresa,
    chavePix: db.configuracoes.chavePix,
    sinalPadrao: db.configuracoes.sinalPadrao,
    endereco: db.configuracoes.endereco,
    frete: db.configuracoes.frete,
    geminiApiKey: apiKey,
    modeloGemini: db.configuracoes.modeloGemini || "gemini-1.5-flash",
    usandoGemini: !!apiKey
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    if (body.action === 'toggle_ia') {
      db.configuracoes.iaAtiva = !db.configuracoes.iaAtiva;
      await saveDb(db);
      return NextResponse.json({ iaAtiva: db.configuracoes.iaAtiva });
    }

    if (body.action === 'atualizar_qrcode') {
      db.configuracoes.statusWhatsApp = 'aguardando_qr';
      db.configuracoes.qrCodeAtual = body.qrCode || '';
      await saveDb(db);
      return NextResponse.json({ sucesso: true, status: 'aguardando_qr' });
    }

    if (body.action === 'atualizar_status_whatsapp') {
      db.configuracoes.statusWhatsApp = body.status || 'desconectado';
      if (body.telefoneConectado) {
        db.configuracoes.telefoneWhatsApp = body.telefoneConectado;
      }
      if (body.status === 'conectado') {
        db.configuracoes.qrCodeAtual = '';
      }
      await saveDb(db);
      return NextResponse.json({ sucesso: true, status: db.configuracoes.statusWhatsApp });
    }

    if (body.action === 'desconectar_whatsapp') {
      db.configuracoes.statusWhatsApp = 'desconectado';
      db.configuracoes.qrCodeAtual = '';
      await saveDb(db);
      return NextResponse.json({ sucesso: true, status: 'desconectado' });
    }

    if (body.action === 'update_config') {
      if (body.nomeEmpresa) db.configuracoes.nomeEmpresa = body.nomeEmpresa;
      if (body.telefoneWhatsApp) db.configuracoes.telefoneWhatsApp = body.telefoneWhatsApp;
      if (body.chavePix) db.configuracoes.chavePix = body.chavePix;
      if (body.sinalPadrao !== undefined) db.configuracoes.sinalPadrao = Number(body.sinalPadrao);
      if (body.promptRecepcionista) db.configuracoes.promptRecepcionista = body.promptRecepcionista;
      if (body.endereco) {
        db.configuracoes.endereco = { ...(db.configuracoes.endereco || {}), ...body.endereco };
        // Sincroniza dados de origem do frete automaticamente com o endereço do estúdio
        if (body.endereco.cep) db.configuracoes.frete.cepOrigem = body.endereco.cep;
        if (body.endereco.cidade) db.configuracoes.frete.cidadeOrigem = body.endereco.cidade;
        if (body.endereco.estado) db.configuracoes.frete.estadoOrigem = body.endereco.estado;
      }
      if (body.frete) db.configuracoes.frete = { ...db.configuracoes.frete, ...body.frete };
      if (body.geminiApiKey !== undefined) db.configuracoes.geminiApiKey = body.geminiApiKey;
      if (body.modeloGemini !== undefined) db.configuracoes.modeloGemini = body.modeloGemini;
      await saveDb(db);
      return NextResponse.json(db.configuracoes);
    }

    if (body.action === 'testar_gemini') {
      const chave = body.geminiApiKey || process.env.GEMINI_API_KEY || db.configuracoes.geminiApiKey;
      const modelo = body.modeloGemini || db.configuracoes.modeloGemini || 'gemini-3.8-flash';
      if (!chave) {
        return NextResponse.json({ sucesso: false, erro: 'Nenhuma Chave de API do Google Gemini informada.' }, { status: 400 });
      }

      const modelosParaTestar = Array.from(new Set([
        modelo,
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest'
      ]));

      const genAI = new GoogleGenerativeAI(chave);
      let ultimoErro = '';

      for (const m of modelosParaTestar) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const res = await model.generateContent("Diga em uma frase elegante que a Manu e o Google Gemini estão conectados e prontos para atender as clientes do Studio ✨");
          return NextResponse.json({
            sucesso: true,
            mensagem: res.response.text(),
            modelo: m
          });
        } catch (err: any) {
          ultimoErro = err.message || 'Falha ao autenticar na API do Google Gemini.';
        }
      }

      return NextResponse.json({
        sucesso: false,
        erro: ultimoErro
      }, { status: 500 });
    }

    if (body.action === 'simular_mensagem' || body.event === 'messages.upsert') {
      const mensagemTexto = body.mensagem || body.data?.message?.conversation || "Olá";
      const remetenteTelefone = (body.telefone || body.sender || (body.data?.key?.remoteJid ? body.data.key.remoteJid.replace('@s.whatsapp.net', '') : "5511999998888")).replace(/\D/g, '');
      const historicoRecebido = Array.isArray(body.historico) ? body.historico : [];

      // Se o cliente já constar no banco com este telefone, usamos o nome oficial cadastrado
      const clienteCadastrado = (db.clientes || []).find(c => c.telefone.replace(/\D/g, '') === remetenteTelefone);
      let remetenteNome = body.clienteNome;
      if (!remetenteNome || remetenteNome === 'Mariana (Teste)' || remetenteNome === 'Cliente') {
        remetenteNome = clienteCadastrado?.nome || body.clienteNome || "Cliente";
      }

      let resultado: { respostaBot: string; agendamentoCriado: Agendamento | null; pedidoCriado?: Pedido | null } | null = null;
      const apiKey = process.env.GEMINI_API_KEY || db.configuracoes.geminiApiKey;
      let motorUtilizado = 'local';

      if (apiKey && db.configuracoes.iaAtiva) {
        try {
          resultado = await gerarRespostaGemini(
            mensagemTexto,
            remetenteNome,
            db,
            apiKey,
            db.configuracoes.modeloGemini || 'gemini-3.8-flash',
            remetenteTelefone,
            historicoRecebido
          );
          if (resultado) {
            motorUtilizado = `google_${db.configuracoes.modeloGemini || 'gemini-3.8-flash'}`;
          }
        } catch (e) {
          console.warn("Erro ao gerar com Gemini, usando fallback local:", e);
        }
      }

      if (!resultado) {
        resultado = await gerarRespostaRecepcionista(mensagemTexto, remetenteNome, db, remetenteTelefone);
      }

      return NextResponse.json({
        sucesso: true,
        respostaBot: resultado.respostaBot,
        agendamentoCriado: resultado.agendamentoCriado,
        pedidoCriado: resultado.pedidoCriado,
        motorUtilizado
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no processamento do WhatsApp' }, { status: 500 });
  }
}
