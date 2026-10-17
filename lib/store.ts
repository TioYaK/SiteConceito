import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  precoTotal: number;
  valorSinal: number;
  categoria: string;
  ativo: boolean;
}

export interface Agendamento {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  servicoId: string;
  servicoNome: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  duracaoMinutos: number;
  valorTotal: number;
  valorSinal: number;
  sinalPago: boolean;
  status: 'aguardando_sinal' | 'confirmado' | 'concluido' | 'cancelado';
  pixCodigo?: string;
  criadoVia: 'whatsapp_ia' | 'manual';
  observacoes?: string;
  createdAt: string;
}

export interface TransacaoCaixa {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: 'sinal_pix' | 'servico_balcao' | 'produto' | 'custo_insumos' | 'contas_fixas';
  formaPagamento: 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito';
  data: string;
  agendamentoId?: string;
}

export interface ItemEstoque {
  id: string;
  nome: string;
  quantidade: number;
  minimoAlerta: number;
  custoUnitario: number;
  precoVenda?: number;
  tipo: 'insumo_uso' | 'venda_balcao';
  descricao?: string;
  categoria?: string;
  beneficios?: string;
  modoUso?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  instagram?: string;
  dataNascimento?: string;
  endereco?: string;
  cep?: string;
  ultimaVisita: string;
  totalAtendimentos: number;
  totalGasto: number;
  curvaturaCilios?: string;
  espessuraFios?: string;
  estiloMapping?: string;
  alergias?: string;
  observacoes?: string;
}

export interface ItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  itens: ItemPedido[];
  tipoEntrega: 'retirada' | 'motoboy' | 'correios';
  endereco?: string;
  cep?: string;
  bairro?: string;
  cidade?: string;
  valorItens: number;
  valorFrete: number;
  valorTotal: number;
  status: 'aguardando_pix' | 'preparando' | 'saiu_entrega' | 'entregue' | 'cancelado';
  pixCodigo: string;
  pago: boolean;
  rastreio?: string;
  createdAt: string;
}

export interface FreteConfig {
  taxaMotoboy: number;
  cepOrigem: string;
  cidadeOrigem: string;
  estadoOrigem: string;
  freteGratisAcimaDe: number;
  permiteRetirada: boolean;
  permiteMotoboy: boolean;
  permiteCorreios: boolean;
}

export interface Configuracoes {
  nomeEmpresa: string;
  telefoneWhatsApp: string;
  statusWhatsApp: 'conectado' | 'desconectado' | 'aguardando_qr';
  chavePix: string;
  tipoChavePix: 'telefone' | 'cpf' | 'email' | 'aleatoria';
  sinalPadrao: number;
  horarioAbertura: string;
  horarioFechamento: string;
  iaAtiva: boolean;
  promptRecepcionista: string;
  frete: FreteConfig;
  geminiApiKey?: string;
  modeloGemini?: string;
  mercadoPagoAtivo?: boolean;
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
}

export interface AppData {
  configuracoes: Configuracoes;
  servicos: Servico[];
  agendamentos: Agendamento[];
  caixa: TransacaoCaixa[];
  estoque: ItemEstoque[];
  clientes: Cliente[];
  pedidos: Pedido[];
}

const DATA_FILE = path.join(process.cwd(), 'data', 'db.json');

// Gera datas relativas para popular o mês
const hoje = new Date();
const formatarDataIso = (d: Date) => d.toISOString().split('T')[0];

const dataHoje = formatarDataIso(hoje);

const dMais1 = new Date(hoje);
dMais1.setDate(hoje.getDate() + 1);
const dataMais1 = formatarDataIso(dMais1);

const dMais2 = new Date(hoje);
dMais2.setDate(hoje.getDate() + 2);
const dataMais2 = formatarDataIso(dMais2);

const dMais5 = new Date(hoje);
dMais5.setDate(hoje.getDate() + 5);
const dataMais5 = formatarDataIso(dMais5);

const dMenos2 = new Date(hoje);
dMenos2.setDate(hoje.getDate() - 2);
const dataMenos2 = formatarDataIso(dMenos2);

const INITIAL_DATA: AppData = {
  configuracoes: {
    nomeEmpresa: "Studio & Estética Facial",
    telefoneWhatsApp: "5511987654321",
    statusWhatsApp: "conectado",
    chavePix: "11987654321",
    tipoChavePix: "telefone",
    sinalPadrao: 30,
    horarioAbertura: "09:00",
    horarioFechamento: "19:00",
    iaAtiva: true,
    promptRecepcionista: "Você é a Manu, recepcionista virtual do Studio. Atenda com simpatia no WhatsApp, tire dúvidas, passe a tabela de valores dos 5 serviços, veja horários livres na agenda e cobre o sinal de PIX para garantir a vaga de até 2h da profissional.",
    frete: {
      taxaMotoboy: 15.00,
      cepOrigem: "01310-100",
      cidadeOrigem: "São Paulo",
      estadoOrigem: "SP",
      freteGratisAcimaDe: 150.00,
      permiteRetirada: true,
      permiteMotoboy: true,
      permiteCorreios: true
    },
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    modeloGemini: "gemini-3.5-flash-lite",
    mercadoPagoAtivo: false,
    mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
    mercadoPagoPublicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || ""
  },
  servicos: [
    {
      id: "srv-cilios",
      nome: "Extensão de Cílios (Volume / Fio a Fio)",
      descricao: "Aplicação fio a fio ou volume para um olhar marcante e preenchido. Duração de até 30 dias.",
      duracaoMinutos: 120,
      precoTotal: 150.00,
      valorSinal: 40.00,
      categoria: "Cílios",
      ativo: true
    },
    {
      id: "srv-sobrancelhas",
      nome: "Design de Sobrancelhas (com Henna)",
      descricao: "Mapeamento geométrico facial para harmonia do rosto, extração com pinça e aplicação de henna de alta fixação.",
      duracaoMinutos: 45,
      precoTotal: 50.00,
      valorSinal: 20.00,
      categoria: "Sobrancelhas",
      ativo: true
    },
    {
      id: "srv-brow-lamination",
      nome: "Brow Lamination + Design",
      descricao: "Alinhamento e laminação dos fios das sobrancelhas para efeito encorpado, alinhado e natural.",
      duracaoMinutos: 60,
      precoTotal: 120.00,
      valorSinal: 30.00,
      categoria: "Sobrancelhas",
      ativo: true
    },
    {
      id: "srv-micropigmentacao",
      nome: "Micropigmentação de Sobrancelhas",
      descricao: "Técnica Shadow Line ou Fio a Fio para preencher falhas e valorizar o formato por até 1 ano e meio.",
      duracaoMinutos: 150,
      precoTotal: 380.00,
      valorSinal: 80.00,
      categoria: "Micropigmentação",
      ativo: true
    },
    {
      id: "srv-limpeza-pele",
      nome: "Limpeza de Pele Profunda",
      descricao: "Higienização profunda, esfoliação, extração de cravos, vapor de ozônio, alta frequência e máscara calmante hidratante.",
      duracaoMinutos: 75,
      precoTotal: 130.00,
      valorSinal: 30.00,
      categoria: "Estética Facial",
      ativo: true
    }
  ],
  agendamentos: [
    {
      id: "ag-1",
      clienteNome: "Camila Rocha",
      clienteTelefone: "5511991234567",
      servicoId: "srv-cilios",
      servicoNome: "Extensão de Cílios (Volume / Fio a Fio)",
      data: dataHoje,
      horario: "09:30",
      duracaoMinutos: 120,
      valorTotal: 150.00,
      valorSinal: 40.00,
      sinalPago: true,
      status: "confirmado",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540540.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***63041A2B",
      criadoVia: "whatsapp_ia",
      observacoes: "Primeira vez na extensão de cílios. Orientada a vir sem rímel.",
      createdAt: new Date().toISOString()
    },
    {
      id: "ag-2",
      clienteNome: "Juliana Mendes",
      clienteTelefone: "5511988887777",
      servicoId: "srv-limpeza-pele",
      servicoNome: "Limpeza de Pele Profunda",
      data: dataHoje,
      horario: "14:00",
      duracaoMinutos: 75,
      valorTotal: 130.00,
      valorSinal: 30.00,
      sinalPago: true,
      status: "confirmado",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540530.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***63049F88",
      criadoVia: "whatsapp_ia",
      observacoes: "Pele com cravinhos na zona T. Quer máscara de argila calmante.",
      createdAt: new Date().toISOString()
    },
    {
      id: "ag-3",
      clienteNome: "Fernanda Ribeiro",
      clienteTelefone: "5511977776666",
      servicoId: "srv-brow-lamination",
      servicoNome: "Brow Lamination + Design",
      data: dataHoje,
      horario: "16:30",
      duracaoMinutos: 60,
      valorTotal: 120.00,
      valorSinal: 30.00,
      sinalPago: false,
      status: "aguardando_sinal",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540530.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304C771",
      criadoVia: "whatsapp_ia",
      observacoes: "Enviado PIX de R$ 30,00 pelo WhatsApp. Aguardando comprovante.",
      createdAt: new Date().toISOString()
    },
    {
      id: "ag-4",
      clienteNome: "Tatiane Barbosa",
      clienteTelefone: "5511966665555",
      servicoId: "srv-micropigmentacao",
      servicoNome: "Micropigmentação de Sobrancelhas",
      data: dataMais1,
      horario: "10:00",
      duracaoMinutos: 150,
      valorTotal: 380.00,
      valorSinal: 80.00,
      sinalPago: true,
      status: "confirmado",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540580.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304D891",
      criadoVia: "whatsapp_ia",
      observacoes: "Quer formato bem arqueado e cor castanho médio.",
      createdAt: new Date().toISOString()
    },
    {
      id: "ag-5",
      clienteNome: "Larissa Prado",
      clienteTelefone: "5511955554444",
      servicoId: "srv-sobrancelhas",
      servicoNome: "Design de Sobrancelhas (com Henna)",
      data: dataMais1,
      horario: "15:30",
      duracaoMinutos: 45,
      valorTotal: 50.00,
      valorSinal: 20.00,
      sinalPago: true,
      status: "confirmado",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540520.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304E119",
      criadoVia: "manual",
      observacoes: "Cliente semanal assídua.",
      createdAt: new Date().toISOString()
    },
    {
      id: "ag-6",
      clienteNome: "Gabriela Vasconcelos",
      clienteTelefone: "5511944443333",
      servicoId: "srv-cilios",
      servicoNome: "Extensão de Cílios (Volume / Fio a Fio)",
      data: dataMais2,
      horario: "14:00",
      duracaoMinutos: 120,
      valorTotal: 150.00,
      valorSinal: 40.00,
      sinalPago: true,
      status: "confirmado",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540540.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304F223",
      criadoVia: "whatsapp_ia",
      observacoes: "Manutenção de volume brasileiro.",
      createdAt: new Date().toISOString()
    },
    {
      id: "ag-7",
      clienteNome: "Vanessa Martins",
      clienteTelefone: "5511933332222",
      servicoId: "srv-limpeza-pele",
      servicoNome: "Limpeza de Pele Profunda",
      data: dataMais5,
      horario: "11:00",
      duracaoMinutos: 75,
      valorTotal: 130.00,
      valorSinal: 30.00,
      sinalPago: false,
      status: "aguardando_sinal",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540530.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304G334",
      criadoVia: "whatsapp_ia",
      observacoes: "Agendado para a próxima semana.",
      createdAt: new Date().toISOString()
    },
    {
      id: "ag-8",
      clienteNome: "Aline Cristina",
      clienteTelefone: "5511922221111",
      servicoId: "srv-cilios",
      servicoNome: "Extensão de Cílios (Volume / Fio a Fio)",
      data: dataMenos2,
      horario: "16:00",
      duracaoMinutos: 120,
      valorTotal: 150.00,
      valorSinal: 40.00,
      sinalPago: true,
      status: "concluido",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540540.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304H445",
      criadoVia: "whatsapp_ia",
      observacoes: "Concluído com sucesso. Amou o resultado!",
      createdAt: new Date().toISOString()
    }
  ],
  caixa: [
    {
      id: "tx-1",
      tipo: "entrada",
      descricao: "Sinal PIX - Camila Rocha (Extensão de Cílios)",
      valor: 40.00,
      categoria: "sinal_pix",
      formaPagamento: "pix",
      data: new Date().toISOString(),
      agendamentoId: "ag-1"
    },
    {
      id: "tx-2",
      tipo: "entrada",
      descricao: "Sinal PIX - Juliana Mendes (Limpeza de Pele)",
      valor: 30.00,
      categoria: "sinal_pix",
      formaPagamento: "pix",
      data: new Date().toISOString(),
      agendamentoId: "ag-2"
    },
    {
      id: "tx-3",
      tipo: "entrada",
      descricao: "Atendimento Concluído - Aline Cristina (Cílios)",
      valor: 110.00,
      categoria: "servico_balcao",
      formaPagamento: "cartao_credito",
      data: dataMenos2
    },
    {
      id: "tx-4",
      tipo: "saida",
      descricao: "Reposição de Cola de Cílios + Emoliente de Cravos",
      valor: 135.00,
      categoria: "custo_insumos",
      formaPagamento: "pix",
      data: new Date().toISOString()
    }
  ],
  estoque: [
    {
      id: "est-1",
      nome: "Cola para Cílios Profissional 3ml",
      quantidade: 2,
      minimoAlerta: 1,
      custoUnitario: 95.00,
      tipo: "insumo_uso"
    },
    {
      id: "est-2",
      nome: "Caixa Fios de Cílios 0.07D Mix",
      quantidade: 5,
      minimoAlerta: 2,
      custoUnitario: 34.00,
      tipo: "insumo_uso"
    },
    {
      id: "est-3",
      nome: "Kit Brow Lamination (Passo 1, 2 e 3)",
      quantidade: 2,
      minimoAlerta: 1,
      custoUnitario: 89.00,
      tipo: "insumo_uso"
    },
    {
      id: "est-4",
      nome: "Pigmento Sobrancelhas Micropigmentação (Castanho)",
      quantidade: 1,
      minimoAlerta: 1,
      custoUnitario: 130.00,
      tipo: "insumo_uso"
    },
    {
      id: "est-5",
      nome: "Loção Emoliente de Cravos para Limpeza de Pele 500ml",
      quantidade: 1,
      minimoAlerta: 1,
      custoUnitario: 48.00,
      tipo: "insumo_uso"
    },
    {
      id: "est-6",
      nome: "Henna Sobrancelhas com Fixador",
      quantidade: 2,
      minimoAlerta: 2,
      custoUnitario: 35.00,
      tipo: "insumo_uso"
    },
    {
      id: "est-7",
      nome: "Espuma Higienizadora Cílios Pós-Procedimento (Venda)",
      quantidade: 6,
      minimoAlerta: 2,
      custoUnitario: 18.00,
      precoVenda: 45.00,
      tipo: "venda_balcao"
    }
  ],
  clientes: [
    {
      id: "cli-1",
      nome: "Camila Rocha",
      telefone: "5511991234567",
      instagram: "@camilasrocha",
      dataNascimento: "1996-05-14",
      ultimaVisita: new Date().toISOString().split('T')[0],
      totalAtendimentos: 6,
      totalGasto: 840.00,
      curvaturaCilios: "D",
      espessuraFios: "0.07",
      estiloMapping: "Volume Brasileiro (Gatinho 8-13mm)",
      alergias: "Nenhuma",
      observacoes: "Adora os cantos externos bem alongados. Não gosta de rímel."
    },
    {
      id: "cli-2",
      nome: "Juliana Mendes",
      telefone: "5511988887777",
      instagram: "@jumendes.estetica",
      dataNascimento: "1992-11-20",
      ultimaVisita: new Date().toISOString().split('T')[0],
      totalAtendimentos: 4,
      totalGasto: 520.00,
      curvaturaCilios: "C",
      espessuraFios: "0.05",
      estiloMapping: "Lash Lifting Natural",
      alergias: "Pele sensível com tendência a acne",
      observacoes: "Prefere máscara calmante de camomila após extração."
    },
    {
      id: "cli-3",
      nome: "Tatiane Barbosa",
      telefone: "5511966665555",
      instagram: "@tatibarboza",
      dataNascimento: "1989-08-03",
      ultimaVisita: "2026-09-15", // mais de 25 dias!
      totalAtendimentos: 8,
      totalGasto: 1450.00,
      curvaturaCilios: "D",
      espessuraFios: "0.07",
      estiloMapping: "Volume Russo Marcante",
      alergias: "Sensibilidade moderada nos olhos",
      observacoes: "Hora da manutenção! Mais de 25 dias desde o último procedimento."
    },
    {
      id: "cli-4",
      nome: "Larissa Prado",
      telefone: "5511955554444",
      instagram: "@lariprado_",
      dataNascimento: "2001-03-28",
      ultimaVisita: "2026-09-10",
      totalAtendimentos: 3,
      totalGasto: 215.00,
      curvaturaCilios: "-",
      espessuraFios: "-",
      estiloMapping: "Design Geométrico + Henna Castanho Médio",
      alergias: "Nenhuma",
      observacoes: "Gosta da henna marcada nas pontas e bem desenhada."
    }
  ],
  pedidos: [
    {
      id: "ped-101",
      clienteNome: "Camila Rocha",
      clienteTelefone: "5511991234567",
      itens: [
        {
          produtoId: "est-7",
          nome: "Espuma Higienizadora Cílios Pós-Procedimento",
          quantidade: 1,
          precoUnitario: 45.00
        }
      ],
      tipoEntrega: "motoboy",
      endereco: "Rua Augusta, 1500, Apto 42",
      bairro: "Consolação",
      cidade: "São Paulo - SP",
      cep: "01304-001",
      valorItens: 45.00,
      valorFrete: 15.00,
      valorTotal: 60.00,
      status: "preparando",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540560.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304PED1",
      pago: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ped-102",
      clienteNome: "Juliana Mendes",
      clienteTelefone: "5511988887777",
      itens: [
        {
          produtoId: "est-7",
          nome: "Espuma Higienizadora Cílios Pós-Procedimento",
          quantidade: 2,
          precoUnitario: 45.00
        }
      ],
      tipoEntrega: "retirada",
      valorItens: 90.00,
      valorFrete: 0.00,
      valorTotal: 90.00,
      status: "aguardando_pix",
      pixCodigo: "00020126360014BR.GOV.BCB.PIX011111987654321520400005303986540590.005802BR5925STUDIO ESTETICA6009SAO PAULO62070503***6304PED2",
      pago: false,
      createdAt: new Date().toISOString()
    }
  ]
};

export function getDbSync(): AppData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      return INITIAL_DATA;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(content) as AppData;
    let modified = false;
    if (!data.pedidos) {
      data.pedidos = INITIAL_DATA.pedidos || [];
      modified = true;
    }
    if (!data.configuracoes.frete) {
      data.configuracoes.frete = INITIAL_DATA.configuracoes.frete;
      modified = true;
    }
    if (modified) {
      saveDbSync(data);
    }
    return data;
  } catch (error) {
    console.error("Erro ao ler banco de dados local:", error);
    return INITIAL_DATA;
  }
}

export function saveDbSync(data: AppData): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Erro ao salvar banco de dados local:", error);
  }
}

export async function getDb(): Promise<AppData> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('id', 'studio_data')
        .maybeSingle();

      if (data && data.data) {
        return data.data as AppData;
      }

      // Se a linha ainda não existir no Supabase, semeia com os dados locais
      const seedData = getDbSync();
      await supabase
        .from('app_data')
        .upsert({ id: 'studio_data', data: seedData });
      return seedData;
    } catch (err) {
      console.error("Erro ao consultar Supabase, utilizando dados locais:", err);
    }
  }

  return getDbSync();
}

export async function saveDb(data: AppData): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({
          id: 'studio_data',
          data,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        return;
      }
      console.error("Erro ao persistir no Supabase:", error);
    } catch (err) {
      console.error("Erro de conexão ao salvar no Supabase:", err);
    }
  }

  saveDbSync(data);
}

