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
  imagemUrl?: string;
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
  imagemUrl?: string;
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

export interface EnderecoStudio {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pontoReferencia?: string;
  linkMaps?: string;
}

export interface Configuracoes {
  nomeEmpresa: string;
  telefoneWhatsApp: string;
  statusWhatsApp: 'conectado' | 'desconectado' | 'aguardando_qr';
  qrCodeAtual?: string;
  chavePix: string;
  tipoChavePix: 'telefone' | 'cpf' | 'email' | 'aleatoria';
  sinalPadrao: number;
  horarioAbertura: string;
  horarioFechamento: string;
  iaAtiva: boolean;
  promptRecepcionista: string;
  endereco?: EnderecoStudio;
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
    nomeEmpresa: "Studio Bruna Meireles",
    telefoneWhatsApp: "5511987654321",
    statusWhatsApp: "conectado",
    chavePix: "11987654321",
    tipoChavePix: "telefone",
    sinalPadrao: 30,
    horarioAbertura: "09:00",
    horarioFechamento: "19:00",
    iaAtiva: true,
    promptRecepcionista: "Você é a Manu, recepcionista virtual inteligente e concierge de beleza do Studio Bruna Meireles. Atenda com simpatia no WhatsApp, tire dúvidas sobre extensão de cílios, sobrancelhas e estética facial, veja horários livres na agenda e cobre o sinal de PIX para garantir a vaga da profissional.",
    endereco: {
      logradouro: "Rua Augusta",
      numero: "1500",
      complemento: "Sala 32",
      bairro: "Consolação",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01304-001",
      pontoReferencia: "Próximo à estação Consolação do Metrô (Linha Verde)",
      linkMaps: "https://maps.google.com/?q=Rua+Augusta,+1500+-+Consola%C3%A7%C3%A3o,+S%C3%A3o+Paulo+-+SP"
    },
    frete: {
      taxaMotoboy: 15.00,
      cepOrigem: "01304-001",
      cidadeOrigem: "São Paulo",
      estadoOrigem: "SP",
      freteGratisAcimaDe: 150.00,
      permiteRetirada: true,
      permiteMotoboy: true,
      permiteCorreios: true
    },
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    modeloGemini: "gemini-3.8-flash",
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
  agendamentos: [],
  caixa: [],
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
  clientes: [],
  pedidos: []
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
    if (!data.configuracoes.endereco) {
      data.configuracoes.endereco = INITIAL_DATA.configuracoes.endereco;
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

