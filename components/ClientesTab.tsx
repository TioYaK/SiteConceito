'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Sparkles, 
  MessageSquare, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Eye, 
  Heart, 
  Instagram, 
  Phone,
  FileText,
  X,
  Cake,
  Gift,
  MapPin,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  RefreshCw,
  AlertCircle,
  Trash2,
  ClipboardPaste,
  CheckCircle
} from 'lucide-react';
import { Cliente } from '@/lib/store';

interface ClientesTabProps {
  clientes: Cliente[];
  onNovoCliente: (cliente: Partial<Cliente>) => void;
  onEditarCliente: (cliente: Partial<Cliente>) => void;
  onRecarregarClientes?: () => void;
}

export function ClientesTab({ 
  clientes, 
  onNovoCliente, 
  onEditarCliente, 
  onRecarregarClientes 
}: ClientesTabProps) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'aniversario' | 'manutencao' | 'vip'>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [curvaturaCilios, setCurvaturaCilios] = useState('D');
  const [espessuraFios, setEspessuraFios] = useState('0.07');
  const [estiloMapping, setEstiloMapping] = useState('Volume Brasileiro (Gatinho)');
  const [alergias, setAlergias] = useState('Nenhuma');
  const [observacoes, setObservacoes] = useState('');

  // Estados do Modal de Importação do WhatsApp
  interface ContatoImportadoPreview {
    idTemp: string;
    nome: string;
    telefone: string;
    telefoneFormatado: string;
    dataNascimento?: string;
    endereco?: string;
    jaExiste: boolean;
    selecionado: boolean;
  }

  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [abaImportacao, setAbaImportacao] = useState<'colar' | 'arquivo'>('colar');
  const [textoColado, setTextoColado] = useState('');
  const [contatosPreview, setContatosPreview] = useState<ContatoImportadoPreview[]>([]);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
  const [nomeArquivoCarregado, setNomeArquivoCarregado] = useState<string | null>(null);

  const formatarTelefoneVisual = (raw: string) => {
    if (!raw) return 'Não informado';
    let clean = raw.replace(/\D/g, '');
    if (clean.length > 13) {
      return `WhatsApp ID: ...${clean.slice(-6)} (Pendente)`;
    }
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }
    if (clean.startsWith('55') && clean.length === 13) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
    }
    if (clean.startsWith('55') && clean.length === 12) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 8)}-${clean.substring(8)}`;
    }
    return raw;
  };

  const processarTextoParaPreview = (raw: string) => {
    if (!raw.trim()) {
      setContatosPreview([]);
      return;
    }

    const telefonesExistentes = new Set(clientes.map(c => c.telefone.replace(/\D/g, '')));
    const linhas = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed: ContatoImportadoPreview[] = [];
    const telefonesVistosNesteLote = new Set<string>();

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];

      const matchTelefone = linha.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/);
      if (!matchTelefone) continue;

      const rawTel = matchTelefone[0];
      let cleanTel = rawTel.replace(/\D/g, '');
      if (cleanTel.length === 10 || cleanTel.length === 11) {
        cleanTel = `55${cleanTel}`;
      }

      if (cleanTel.length < 10) continue;

      let nomeExtraido = linha
        .replace(rawTel, '')
        .replace(/^[-\s,:;|•/]+|[-\s,:;|•/]+$/g, '')
        .trim();

      let dataNasc = '';
      const matchNasc = nomeExtraido.match(/\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])(?:[\/\-](19\d\d|20\d\d))?\b/);
      if (matchNasc) {
        dataNasc = matchNasc[0];
        nomeExtraido = nomeExtraido.replace(matchNasc[0], '').replace(/^[-\s,:;|•/]+|[-\s,:;|•/]+$/g, '').trim();
      }

      if (!nomeExtraido || nomeExtraido.length < 2) {
        nomeExtraido = `Cliente ${cleanTel.slice(-4)}`;
      }

      if (telefonesVistosNesteLote.has(cleanTel)) continue;
      telefonesVistosNesteLote.add(cleanTel);

      const jaExiste = telefonesExistentes.has(cleanTel);

      parsed.push({
        idTemp: `prev-${i}-${Date.now()}`,
        nome: nomeExtraido,
        telefone: cleanTel,
        telefoneFormatado: formatarTelefoneVisual(cleanTel),
        dataNascimento: dataNasc,
        jaExiste,
        selecionado: !jaExiste
      });
    }

    setContatosPreview(parsed);
  };

  const handleLerArquivo = async (file: File) => {
    setNomeArquivoCarregado(file.name);
    const content = await file.text();

    if (file.name.toLowerCase().endsWith('.vcf')) {
      const cartoes = content.split(/BEGIN:VCARD/i).filter(c => c.includes('END:VCARD'));
      const parsed: ContatoImportadoPreview[] = [];
      const telefonesExistentes = new Set(clientes.map(c => c.telefone.replace(/\D/g, '')));
      const telefonesVistos = new Set<string>();

      cartoes.forEach((card, idx) => {
        let nome = '';
        let tel = '';
        let bday = '';

        const fnMatch = card.match(/FN(?:;[^:]*)?:([^\r\n]+)/i);
        if (fnMatch) nome = fnMatch[1].trim();

        if (!nome) {
          const nMatch = card.match(/N(?:;[^:]*)?:([^\r\n]+)/i);
          if (nMatch) {
            const parts = nMatch[1].split(';').filter(Boolean);
            nome = parts.reverse().join(' ').trim();
          }
        }

        const telMatch = card.match(/TEL(?:;[^:]*)?:([^\r\n]+)/i);
        if (telMatch) tel = telMatch[1].replace(/\D/g, '');

        const bdayMatch = card.match(/BDAY(?:;[^:]*)?:([^\r\n]+)/i);
        if (bdayMatch) bday = bdayMatch[1].trim();

        if (tel.length === 10 || tel.length === 11) {
          tel = `55${tel}`;
        }

        if (tel.length >= 10 && !telefonesVistos.has(tel)) {
          telefonesVistos.add(tel);
          const jaExiste = telefonesExistentes.has(tel);
          parsed.push({
            idTemp: `vcf-${idx}`,
            nome: nome || `Contato ${tel.slice(-4)}`,
            telefone: tel,
            telefoneFormatado: formatarTelefoneVisual(tel),
            dataNascimento: bday,
            jaExiste,
            selecionado: !jaExiste
          });
        }
      });

      setContatosPreview(parsed);
    } else {
      processarTextoParaPreview(content);
    }
  };

  const handleSalvarContatosLote = async () => {
    const selecionados = contatosPreview.filter(c => c.selecionado);
    if (selecionados.length === 0) {
      alert("Nenhum contato selecionado para importação.");
      return;
    }

    setSalvandoLote(true);
    setResultadoImportacao(null);

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importar_lote',
          clientes: selecionados.map(s => ({
            nome: s.nome,
            telefone: s.telefone,
            dataNascimento: s.dataNascimento || '',
            endereco: s.endereco || '',
            observacoes: 'Importado da lista de contatos do WhatsApp'
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.sucesso) {
        setResultadoImportacao({
          sucesso: true,
          mensagem: `🎉 ${data.importados} ${data.importados === 1 ? 'cliente importada' : 'clientes importadas'} com sucesso!${data.duplicadosIgnorados > 0 ? ` (${data.duplicadosIgnorados} duplicados ignorados)` : ''}`
        });

        if (onRecarregarClientes) {
          onRecarregarClientes();
        }

        setTimeout(() => {
          setModalImportarAberto(false);
          setContatosPreview([]);
          setTextoColado('');
          setResultadoImportacao(null);
        }, 2200);
      } else {
        setResultadoImportacao({
          sucesso: false,
          mensagem: data.error || 'Erro ao importar contatos.'
        });
      }
    } catch {
      setResultadoImportacao({
        sucesso: false,
        mensagem: 'Erro de conexão ao salvar no banco de dados.'
      });
    } finally {
      setSalvandoLote(false);
    }
  };

  const mesAtual = new Date().getMonth() + 1; // 1 a 12
  const diaHoje = new Date().getDate();

  const calcularDiasSemVir = (dataIso: string) => {
    try {
      const hoje = new Date();
      const ultima = new Date(dataIso + 'T00:00:00');
      const diffTime = Math.abs(hoje.getTime() - ultima.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const ehAniversarianteDoMes = (dataNasc?: string) => {
    if (!dataNasc) return false;
    try {
      // Formato YYYY-MM-DD ou DD/MM
      if (dataNasc.includes('-')) {
        const parts = dataNasc.split('-');
        if (parts.length >= 2) {
          const mes = parseInt(parts[1], 10);
          return mes === mesAtual;
        }
      } else if (dataNasc.includes('/')) {
        const parts = dataNasc.split('/');
        if (parts.length >= 2) {
          const mes = parseInt(parts[1], 10);
          return mes === mesAtual;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const ehAniversarianteHoje = (dataNasc?: string) => {
    if (!dataNasc) return false;
    try {
      let dia = 0;
      let mes = 0;
      if (dataNasc.includes('-')) {
        const parts = dataNasc.split('-');
        if (parts.length >= 3) {
          mes = parseInt(parts[1], 10);
          dia = parseInt(parts[2], 10);
        }
      } else if (dataNasc.includes('/')) {
        const parts = dataNasc.split('/');
        if (parts.length >= 2) {
          dia = parseInt(parts[0], 10);
          mes = parseInt(parts[1], 10);
        }
      }
      return dia === diaHoje && mes === mesAtual;
    } catch {
      return false;
    }
  };

  const formatarAniversario = (dataNasc?: string) => {
    if (!dataNasc) return 'Não informado';
    try {
      if (dataNasc.includes('-')) {
        const parts = dataNasc.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
      }
      return dataNasc;
    } catch {
      return dataNasc;
    }
  };

  const aniversariantesMes = clientes.filter(c => ehAniversarianteDoMes(c.dataNascimento));
  const totalEmManutencao = clientes.filter(c => calcularDiasSemVir(c.ultimaVisita) >= 20).length;
  const totalLtv = clientes.reduce((acc, c) => acc + c.totalGasto, 0);

  const clientesFiltrados = clientes.filter(c => {
    const atendeBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || 
      c.telefone.includes(busca) || 
      (c.endereco || '').toLowerCase().includes(busca.toLowerCase());
    if (!atendeBusca) return false;

    if (filtro === 'aniversario') {
      return ehAniversarianteDoMes(c.dataNascimento);
    }
    if (filtro === 'manutencao') {
      return calcularDiasSemVir(c.ultimaVisita) >= 20;
    }
    if (filtro === 'vip') {
      return c.totalAtendimentos >= 4 || c.totalGasto >= 500;
    }
    return true;
  });

  const abrirMensagemRecuperacao = (cliente: Cliente) => {
    const tel = cliente.telefone.replace(/\D/g, '');
    const dias = calcularDiasSemVir(cliente.ultimaVisita);
    const msg = `Oi ${cliente.nome.split(' ')[0]}, tudo bem? 🌸 Aqui é do Studio! Já faz ${dias} dias da sua última visita (${cliente.estiloMapping || 'cílios'}).\n\nQue tal aproveitarmos para agendar a sua manutenção essa semana e deixar o olhar impecável de novo? ✨ Tenho horários quinta e sexta! Me avisa qual fica melhor pra você! 💕`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const abrirMensagemAniversario = (cliente: Cliente) => {
    const tel = cliente.telefone.replace(/\D/g, '');
    const hojeAniver = ehAniversarianteHoje(cliente.dataNascimento);
    const saudacao = hojeAniver ? "PARABÉNS PELO SEU ANIVERSÁRIO HOJE! 🎉🎂" : "Seu aniversário está chegando! 🎂✨";
    const msg = `Olá, ${cliente.nome.split(' ')[0]}! 🌸 ${saudacao}\n\nPassando com muito carinho aqui do Studio para celebrar o seu dia especial! Como você faz parte do nosso Clube VIP de Clientes, preparamos um PRESENTE EXCLUSIVO para o seu mês:\n\n🎁 *Você ganhou R$ 30,00 de desconto* em qualquer procedimento ou *uma hidratação facial express de presente* para comemorar ainda mais maravilhosa! ✨\n\nQue dia fica melhor para agendarmos o seu momento de beleza e você aproveitar o seu presente? 💕`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const abrirModalCadastro = (c?: Cliente) => {
    if (c) {
      setClienteSelecionado(c);
      setNome(c.nome);
      setTelefone(c.telefone);
      setInstagram(c.instagram || '');
      setDataNascimento(c.dataNascimento || '');
      setEndereco(c.endereco || '');
      setCep(c.cep || '');
      setCurvaturaCilios(c.curvaturaCilios || 'D');
      setEspessuraFios(c.espessuraFios || '0.07');
      setEstiloMapping(c.estiloMapping || 'Volume Brasileiro (Gatinho)');
      setAlergias(c.alergias || 'Nenhuma');
      setObservacoes(c.observacoes || '');
    } else {
      setClienteSelecionado(null);
      setNome('');
      setTelefone('');
      setInstagram('');
      setDataNascimento('');
      setEndereco('');
      setCep('');
      setCurvaturaCilios('D');
      setEspessuraFios('0.07');
      setEstiloMapping('Volume Brasileiro (Gatinho)');
      setAlergias('Nenhuma');
      setObservacoes('');
    }
    setModalAberto(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) return;

    const payload = {
      nome: nome.trim(),
      telefone: telefone.trim(),
      instagram: instagram.trim(),
      dataNascimento: dataNascimento.trim(),
      endereco: endereco.trim(),
      cep: cep.trim(),
      curvaturaCilios,
      espessuraFios,
      estiloMapping,
      alergias: alergias.trim(),
      observacoes: observacoes.trim()
    };

    if (clienteSelecionado) {
      onEditarCliente({ id: clienteSelecionado.id, ...payload });
    } else {
      onNovoCliente(payload);
    }

    setModalAberto(false);
  };

  const nomeMesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

  return (
    <div className="space-y-4 pb-20">
      {/* 4 Cartões de Métricas do CRM & Aniversários */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-3xl p-4 text-white shadow-md shadow-emerald-200/40 dark:shadow-none col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
                Fidelização & LTV
              </span>
              <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Heart className="w-3.5 h-3.5 text-emerald-100" />
              </span>
            </div>
            <p className="text-2xl font-black mt-1">
              R$ {totalLtv.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <p className="text-[11px] text-emerald-100/90 font-medium mt-1">
            Total investido pelas clientes
          </p>
        </div>

        {/* Card Clube de Aniversariantes */}
        <div className="bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-amber-500/10 dark:from-pink-950/40 dark:to-rose-950/30 rounded-3xl p-4 border border-pink-200/60 dark:border-pink-900/60 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider flex items-center gap-1">
              <Cake className="w-3.5 h-3.5 text-pink-500" /> Aniversários
            </span>
            {aniversariantesMes.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
            )}
          </div>
          <p className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-1">
            {aniversariantesMes.length} {aniversariantesMes.length === 1 ? 'cliente' : 'clientes'}
          </p>
          <p className="text-[11px] text-pink-600/80 dark:text-pink-400 font-semibold mt-1 capitalize">
            Neste mês de {nomeMesAtual} 🎂
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Clientes</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{clientes.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Fichas e cadastros ativos
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hora de Chamar</p>
            {totalEmManutencao > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </div>
          <p className="text-2xl font-black text-amber-500 mt-1">
            {totalEmManutencao} {totalEmManutencao === 1 ? 'cliente' : 'clientes'}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
            Mais de 20 dias sem voltar
          </p>
        </div>
      </div>

      {/* Barra de Busca & Filtros Rápidos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-colors">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFiltro('todos')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filtro === 'todos'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({clientes.length})
          </button>

          <button
            onClick={() => setFiltro('aniversario')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filtro === 'aniversario'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60'
            }`}
          >
            <Cake className="w-3.5 h-3.5 text-pink-500" />
            <span>🎂 Aniversariantes ({aniversariantesMes.length})</span>
          </button>

          <button
            onClick={() => setFiltro('manutencao')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filtro === 'manutencao'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Manutenção (+20d)</span>
          </button>

          <button
            onClick={() => setFiltro('vip')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filtro === 'vip'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>VIP</span>
          </button>

          <button
            onClick={() => {
              setModalImportarAberto(true);
              setResultadoImportacao(null);
            }}
            className="ml-auto sm:ml-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-sm shadow-emerald-600/30"
            title="Importar lista de contatos do WhatsApp ou arquivo CSV/vCard"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importar WhatsApp</span>
            <span className="sm:hidden">Importar</span>
          </button>

          <button
            onClick={() => abrirModalCadastro()}
            className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 flex-shrink-0 shadow-sm border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova Cliente</span>
          </button>
        </div>
      </div>

      {/* Lista de Clientes com Ficha Técnica & Aniversário */}
      <div className="space-y-3">
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma cliente encontrada neste filtro</p>
          </div>
        ) : (
          clientesFiltrados.map((c) => {
            const diasSemVir = calcularDiasSemVir(c.ultimaVisita);
            const precisaManutencao = diasSemVir >= 20;
            const isAniversarianteMes = ehAniversarianteDoMes(c.dataNascimento);
            const isAniversarianteHoje = ehAniversarianteHoje(c.dataNascimento);

            return (
              <div
                key={c.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border shadow-sm transition-all space-y-3 ${
                  isAniversarianteHoje
                    ? 'border-pink-300 dark:border-pink-800 bg-pink-50/20 dark:bg-pink-950/20 ring-2 ring-pink-400'
                    : isAniversarianteMes
                    ? 'border-pink-200 dark:border-pink-900/60 bg-pink-50/10 dark:bg-pink-950/10'
                    : precisaManutencao
                    ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/15 dark:bg-amber-950/15'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Dados Pessoais & Histórico */}
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl text-white font-black text-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isAniversarianteMes 
                        ? 'bg-gradient-to-tr from-pink-500 to-rose-500' 
                        : 'bg-gradient-to-tr from-emerald-500 to-teal-500'
                    }`}>
                      {isAniversarianteMes ? '🎂' : c.nome.charAt(0)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">
                          {c.nome}
                        </h4>

                        {isAniversarianteHoje && (
                          <span className="text-[10px] font-black bg-pink-600 text-white px-2 py-0.5 rounded-full uppercase animate-pulse flex items-center gap-1 shadow-sm">
                            <Cake className="w-3 h-3" /> Aniversário HOJE! 🎉
                          </span>
                        )}

                        {!isAniversarianteHoje && isAniversarianteMes && (
                          <span className="text-[10px] font-bold bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-full uppercase border border-pink-200 dark:border-pink-800 flex items-center gap-1">
                            <Cake className="w-3 h-3" /> Aniversariante deste Mês
                          </span>
                        )}

                        {precisaManutencao && (
                          <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full uppercase border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {diasSemVir} dias sem voltar
                          </span>
                        )}

                        {c.totalAtendimentos >= 4 && (
                          <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase">
                            💎 VIP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {formatarTelefoneVisual(c.telefone)}
                        </span>

                        {c.dataNascimento && (
                          <>
                            <span>•</span>
                            <span className={`flex items-center gap-1 font-semibold ${isAniversarianteMes ? 'text-pink-600 dark:text-pink-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                              <Cake className="w-3 h-3" /> Aniver: {formatarAniversario(c.dataNascimento)}
                            </span>
                          </>
                        )}

                        {c.instagram && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-semibold">
                              <Instagram className="w-3 h-3" /> {c.instagram}
                            </span>
                          </>
                        )}

                        <span>•</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          R$ {c.totalGasto.toFixed(2).replace('.', ',')} investidos ({c.totalAtendimentos}x)
                        </span>
                      </div>

                      {/* Endereço Cadastrado */}
                      {c.endereco ? (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {c.endereco} {c.cep ? `(CEP: ${c.cep})` : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span>Endereço pendente na ficha</span>
                        </div>
                      )}

                      {/* Ficha Técnica de Procedimento (Anamnese) */}
                      <div className="mt-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Curvatura</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{c.curvaturaCilios || 'D'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Espessura</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{c.espessuraFios || '0.07'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Estilo Mapping</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 truncate block">{c.estiloMapping || 'Volume Brasileiro'}</span>
                        </div>
                      </div>

                      {c.alergias && c.alergias.toLowerCase() !== 'nenhuma' && (
                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Alergia / Cuidado: {c.alergias}
                        </p>
                      )}

                      {c.observacoes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          "{c.observacoes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Botão de Enviar Mimo de Aniversário */}
                    {isAniversarianteMes && (
                      <button
                        onClick={() => abrirMensagemAniversario(c)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-pink-500/20 transition cursor-pointer"
                        title="Enviar cupom/mimo de aniversário no WhatsApp"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Mimo Aniversário 🎁</span>
                      </button>
                    )}

                    {precisaManutencao && !isAniversarianteMes && (
                      <button
                        onClick={() => abrirMensagemRecuperacao(c)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-200 dark:shadow-none transition cursor-pointer"
                        title="Chamar no WhatsApp com mensagem de lembrete pronta"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Lembrete no Zap</span>
                      </button>
                    )}

                    <button
                      onClick={() => abrirModalCadastro(c)}
                      className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Editar Ficha</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Cadastro / Edição de Cliente */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  {clienteSelecionado ? 'Editar Ficha da Cliente' : 'Nova Cliente & Anamnese'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cadastro completo, aniversário e endereço</p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Lima Rocha"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    WhatsApp (com DDD)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-8888"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-pink-700 dark:text-pink-400 block mb-1 flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5" /> Aniversário (DD/MM)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 24/10 ou 1996-10-24"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full bg-pink-50/50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 font-bold"
                  />
                </div>
              </div>

              {/* Endereço e CEP */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Endereço Completo (Rua, Nº, Bairro)
                  </label>
                  <input
                    type="text"
                    placeholder="Rua Bela Cintra, 890, Ap 32 - Consolação"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    placeholder="01415-000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Instagram (opcional)
                </label>
                <input
                  type="text"
                  placeholder="@usuario"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Parâmetros Técnicos de Cílios */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Ficha Técnica de Cílios & Sobrancelhas
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Curvatura dos Fios
                    </label>
                    <select
                      value={curvaturaCilios}
                      onChange={(e) => setCurvaturaCilios(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                    >
                      <option value="C">C (Mais Natural)</option>
                      <option value="D">D (Curvatura Marcante)</option>
                      <option value="L">L (Efeito Delineado)</option>
                      <option value="M">M (Olhar Levantado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Espessura
                    </label>
                    <select
                      value={espessuraFios}
                      onChange={(e) => setEspessuraFios(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                    >
                      <option value="0.05">0.05 (Volume Russo Mega)</option>
                      <option value="0.07">0.07 (Volume Russo Padrão)</option>
                      <option value="0.15">0.15 (Clássico Fio a Fio)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Estilo de Mapping / Preferência
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Volume Brasileiro Gatinho (8 ao 13mm)"
                    value={estiloMapping}
                    onChange={(e) => setEstiloMapping(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Alergias ou Sensibilidade (se houver)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nenhuma ou Alergia a esmalte..."
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações Gerais
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gosta de café sem açúcar, prefere atendimentos às sextas..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition cursor-pointer mt-2"
              >
                Salvar Ficha da Cliente ✨
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação de Contatos do WhatsApp */}
      {modalImportarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Importar Contatos do WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Traga suas clientes antigas e contatos do WhatsApp para o CRM e Clube de Aniversariantes.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalImportarAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas: Colar Texto vs Arquivo */}
            <div className="px-4 sm:px-5 pt-3">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAbaImportacao('colar')}
                  className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    abaImportacao === 'colar'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>1. Colar Lista de Nomes e Telefones</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaImportacao('arquivo')}
                  className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    abaImportacao === 'arquivo'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>2. Subir Arquivo (.vcf ou .csv)</span>
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {abaImportacao === 'colar' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cole sua lista abaixo (do WhatsApp, Bloco de Notas ou Excel):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const exemplo = `Mariana Silva - (11) 98765-4321\nCamila Ferreira, 11999998888, 15/04\nFernanda Lima: 5511988881234\nJuliana Santos - 11 91234-5678 - Bela Vista\nBeatriz Rocha (11) 97777-6666`;
                        setTextoColado(exemplo);
                        processarTextoParaPreview(exemplo);
                      }}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Preencher Exemplo
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    placeholder={`Cole aqui as linhas com nomes e telefones, por exemplo:\nMariana Silva - (11) 98765-4321\nCamila Ferreira, 11999998888, 15/04\nFernanda Lima: 5511988881234`}
                    value={textoColado}
                    onChange={(e) => {
                      setTextoColado(e.target.value);
                      processarTextoParaPreview(e.target.value);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />

                  <p className="text-[11px] text-slate-400">
                    💡 O sistema reconhece automaticamente qualquer formato de telefone brasileiro com DDD (com ou sem traço, parênteses ou +55).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                    <Upload className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Selecione um arquivo de contatos (.vcf ou .csv)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Você pode exportar contatos do seu celular (iPhone ou Android) em formato vCard (.vcf) ou exportar do Google Contatos em .csv.
                    </p>

                    <label className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Escolher Arquivo do Computador</span>
                      <input
                        type="file"
                        accept=".vcf,.csv,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLerArquivo(file);
                        }}
                      />
                    </label>

                    {nomeArquivoCarregado && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">
                        📄 Arquivo carregado: {nomeArquivoCarregado}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pré-visualização dos Contatos Detectados */}
              {contatosPreview.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Encontrados</span>
                      <span className="text-base font-extrabold text-slate-800 dark:text-white">
                        {contatosPreview.length}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold uppercase">Prontos p/ Importar</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {contatosPreview.filter(c => c.selecionado && !c.jaExiste).length}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-semibold uppercase">Já Cadastrados</span>
                      <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                        {contatosPreview.filter(c => c.jaExiste).length}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Contatos */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {contatosPreview.map((item) => (
                      <div
                        key={item.idTemp}
                        className={`p-2.5 flex items-center justify-between gap-2.5 transition ${
                          item.jaExiste 
                            ? 'bg-slate-50/50 dark:bg-slate-800/30 opacity-60' 
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            disabled={item.jaExiste}
                            checked={item.selecionado}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setContatosPreview(prev => prev.map(p => p.idTemp === item.idTemp ? { ...p, selecionado: checked } : p));
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer disabled:opacity-40"
                          />

                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate">
                              {item.nome}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {item.telefoneFormatado}
                              {item.dataNascimento && (
                                <span className="ml-2 font-sans text-pink-600 dark:text-pink-400 font-semibold">
                                  🎂 {item.dataNascimento}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div>
                          {item.jaExiste ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Já Cadastrada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Nova Cliente ✨
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem de Feedback */}
              {resultadoImportacao && (
                <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in ${
                  resultadoImportacao.sucesso
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                }`}>
                  {resultadoImportacao.sucesso ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold">{resultadoImportacao.mensagem}</span>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setModalImportarAberto(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSalvarContatosLote}
                disabled={salvandoLote || contatosPreview.filter(c => c.selecionado).length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20 disabled:opacity-40 cursor-pointer"
              >
                {salvandoLote ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importando Contatos...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      Importar {contatosPreview.filter(c => c.selecionado).length}{' '}
                      {contatosPreview.filter(c => c.selecionado).length === 1 ? 'Contato' : 'Contatos'} para o Studio
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
