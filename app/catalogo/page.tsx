'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  MessageSquare, 
  ShoppingBag, 
  Bike, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  ExternalLink, 
  Check, 
  ChevronRight, 
  Search,
  Star,
  Zap,
  Tag,
  Calculator,
  Moon,
  Sun,
  Cake,
  Gift
} from 'lucide-react';

interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  precoTotal: number;
  valorSinal: number;
  categoria: string;
  ativo: boolean;
}

interface ItemEstoque {
  id: string;
  nome: string;
  quantidade: number;
  precoVenda?: number;
  categoria?: string;
  descricao?: string;
  beneficios?: string;
  modoUso?: string;
}

interface CatalogoData {
  nomeEmpresa: string;
  telefoneWhatsApp: string;
  horarioAbertura: string;
  horarioFechamento: string;
  frete: {
    taxaMotoboy: number;
    cidadeOrigem: string;
    estadoOrigem: string;
    freteGratisAcimaDe: number;
  };
  mercadoPagoAtivo: boolean;
  servicos: Servico[];
  produtos: ItemEstoque[];
}

export default function CatalogoPublicoPage() {
  const [dados, setDados] = useState<CatalogoData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'servicos' | 'produtos' | 'frete'>('servicos');
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [temaEscuro, setTemaEscuro] = useState(false);

  // Simulador de Frete
  const [cepDestino, setCepDestino] = useState('');
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [resultadoFrete, setResultadoFrete] = useState<any>(null);
  const [erroFrete, setErroFrete] = useState('');

  useEffect(() => {
    // Detecta tema preferido ou salvo
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTemaEscuro(isDark);
    }

    const carregarCatalogo = async () => {
      try {
        const res = await fetch('/api/catalogo');
        if (res.ok) {
          const json = await res.json();
          setDados(json);
        }
      } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
      } finally {
        setCarregando(false);
      }
    };

    carregarCatalogo();
  }, []);

  const toggleTema = () => {
    const novoTema = !temaEscuro;
    setTemaEscuro(novoTema);
    if (novoTema) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const telefoneLimpo = dados?.telefoneWhatsApp?.replace(/\D/g, '') || '5511999998888';

  const criarLinkWhatsApp = (mensagem: string) => {
    return `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
  };

  const handleSimularFrete = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cepDestino.replace(/\D/g, '');
    if (clean.length !== 8) {
      setErroFrete('Digite um CEP válido com 8 dígitos.');
      return;
    }
    setCalculandoFrete(true);
    setErroFrete('');
    setResultadoFrete(null);

    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: clean, valorCarrinho: 50.00 })
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoFrete(data);
      } else {
        setErroFrete(data.error || 'Não foi possível cotar o frete para este CEP.');
      }
    } catch {
      setErroFrete('Falha de conexão com os Correios.');
    } finally {
      setCalculandoFrete(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">Carregando Catálogo Especializado...</p>
      </div>
    );
  }

  const servicos = dados?.servicos || [];
  const produtos = dados?.produtos || [];

  // Categorias disponíveis
  const categoriasServicos = ['todas', ...Array.from(new Set(servicos.map(s => s.categoria)))];
  const categoriasProdutos = ['todas', ...Array.from(new Set(produtos.map(p => p.categoria || 'Geral')))];

  const servicosFiltrados = servicos.filter(s => {
    if (filtroCategoria !== 'todas' && s.categoria !== filtroCategoria) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      return s.nome.toLowerCase().includes(termo) || s.descricao.toLowerCase().includes(termo);
    }
    return true;
  });

  const produtosFiltrados = produtos.filter(p => {
    if (filtroCategoria !== 'todas' && (p.categoria || 'Geral') !== filtroCategoria) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      return p.nome.toLowerCase().includes(termo) || (p.descricao || '').toLowerCase().includes(termo) || (p.beneficios || '').toLowerCase().includes(termo);
    }
    return true;
  });

  return (
    <div className={`min-h-screen transition-colors ${temaEscuro ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Topo / Header Profile Studio */}
      <header className="relative bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white pt-8 pb-12 px-4 shadow-xl">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 border border-white/10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Catálogo Oficial & Atendimento IA 24h
            </span>

            <button
              onClick={toggleTema}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition cursor-pointer"
              title="Alternar Modo Claro/Escuro"
            >
              {temaEscuro ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-200 p-0.5 shadow-xl">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-2xl font-black text-emerald-400">
                  ✨
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" title="Online Agora">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {dados?.nomeEmpresa || 'Studio Bella'}
                </h1>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                Cílios • Sobrancelhas • Micropigmentação • Cuidados Pós
              </p>
              <div className="flex items-center gap-3 text-[11px] text-emerald-200/80 mt-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-300" />
                  {dados?.horarioAbertura || '09:00'} às {dados?.horarioFechamento || '19:00'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {dados?.frete?.cidadeOrigem || 'São Paulo'} - {dados?.frete?.estadoOrigem || 'SP'}
                </span>
              </div>
            </div>
          </div>

          {/* Destaque Atendimento IA */}
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                M
              </div>
              <div>
                <p className="font-bold text-white leading-none">Manu • Recepcionista Virtual (IA)</p>
                <p className="text-[11px] text-emerald-200 mt-0.5">Tira dúvidas, reserva horários e calcula fretes na hora.</p>
              </div>
            </div>

            <a
              href={criarLinkWhatsApp('Olá Manu! Quero tirar dúvidas e agendar um horário!')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chamar</span>
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-2xl mx-auto px-4 -mt-5 pb-36 sm:pb-40 space-y-4">
        {/* Banner Clube VIP de Aniversariantes */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-amber-500/15 border border-pink-500/30 dark:border-pink-800/40 flex items-center justify-between gap-3 shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm shadow-pink-500/20">
              🎂
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Clube de Aniversariantes VIP
                </span>
                <span className="text-[10px] font-bold bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 px-2 py-0.2 rounded-full">
                  Presente Garantido 🎁
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cadastre seu aniversário no WhatsApp e ganhe <strong>R$ 30 OFF</strong> ou mimo facial exclusivo no seu mês!
              </p>
            </div>
          </div>

          <a
            href={criarLinkWhatsApp('Olá Manu! Quero me cadastrar no Clube de Aniversariantes do Studio para receber meu mimo/desconto! 🎂\n\nNome completo: \nData de aniversário: \nEndereço: ')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs shrink-0 shadow-sm transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap"
          >
            <span>Cadastrar</span>
          </a>
        </div>

        {/* Seletor de Abas Principais */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-1">
          <button
            onClick={() => {
              setAbaAtiva('servicos');
              setFiltroCategoria('todas');
            }}
            className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              abaAtiva === 'servicos'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Procedimentos</span>
          </button>

          <button
            onClick={() => {
              setAbaAtiva('produtos');
              setFiltroCategoria('todas');
            }}
            className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              abaAtiva === 'produtos'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Produtos Home-Care</span>
          </button>

          <button
            onClick={() => setAbaAtiva('frete')}
            className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              abaAtiva === 'frete'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4 text-teal-400" />
            <span>Entrega & Frete</span>
          </button>
        </div>

        {/* Barra de Busca e Categorias (Para Serviços e Produtos) */}
        {abaAtiva !== 'frete' && (
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={abaAtiva === 'servicos' ? "Buscar procedimento (ex: Cílios, Brow, Henna)..." : "Buscar produto (ex: Espuma, Sérum, Gel)..."}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            {/* Pílulas de Categoria */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(abaAtiva === 'servicos' ? categoriasServicos : categoriasProdutos).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer capitalize ${
                    filtroCategoria === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat === 'todas' ? 'Todos os itens' : cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ABA 1: PROCEDIMENTOS */}
        {abaAtiva === 'servicos' && (
          <div className="space-y-3">
            {servicosFiltrados.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Nenhum procedimento encontrado</p>
              </div>
            ) : (
              servicosFiltrados.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-all hover:border-emerald-300 dark:hover:border-emerald-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                        {srv.categoria}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {srv.nome}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {srv.descricao}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white block">
                        R$ {srv.precoTotal.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        Sinal: R$ {srv.valorSinal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Duração média: <b>{srv.duracaoMinutos} min</b>
                    </span>

                    <a
                      href={criarLinkWhatsApp(`Olá Manu! ✨ Vi no catálogo e gostaria de agendar o procedimento *${srv.nome}* (R$ ${srv.precoTotal.toFixed(2).replace('.', ',')}). Quais os próximos horários disponíveis?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Agendar no WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA 2: PRODUTOS HOME-CARE */}
        {abaAtiva === 'produtos' && (
          <div className="space-y-3">
            {/* Banner de Entrega Rápida */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Entrega no Mesmo Dia por Motoboy!</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Peça pelo WhatsApp e receba em casa ou retire sem frete no Studio.
                  </p>
                </div>
              </div>
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Nenhum produto encontrado</p>
              </div>
            ) : (
              produtosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-all hover:border-emerald-300 dark:hover:border-emerald-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">
                          {item.categoria || 'Home-Care'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Em Estoque
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {item.nome}
                      </h3>

                      {item.descricao && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {item.descricao}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block">
                        R$ {item.precoVenda?.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        À vista ou no cartão
                      </span>
                    </div>
                  </div>

                  {/* Benefícios e Modo de Uso */}
                  {(item.beneficios || item.modoUso) && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      {item.beneficios && (
                        <p className="text-slate-700 dark:text-slate-300">
                          <strong className="text-emerald-600 dark:text-emerald-400">✨ Benefícios: </strong>
                          {item.beneficios}
                        </p>
                      )}
                      {item.modoUso && (
                        <p className="text-slate-600 dark:text-slate-400">
                          <strong className="text-indigo-600 dark:text-indigo-400">🧴 Como usar: </strong>
                          {item.modoUso}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-[11px] text-slate-400">
                      📦 Pronta entrega no Studio
                    </span>

                    <a
                      href={criarLinkWhatsApp(`Olá Manu! 🌸 Vi o produto *${item.nome}* no catálogo (R$ ${item.precoVenda?.toFixed(2).replace('.', ',')}) e quero comprar! Como faço para receber por motoboy ou retirar no local?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Pedir no WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA 3: SIMULADOR DE ENTREGA E FRETE */}
        {abaAtiva === 'frete' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Calcular Entrega para Sua Casa
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consulte valores de Motoboy Express e Correios
                  </p>
                </div>
              </div>

              <form onSubmit={handleSimularFrete} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite seu CEP (ex: 01310-100)"
                  value={cepDestino}
                  onChange={(e) => setCepDestino(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={calculandoFrete}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {calculandoFrete ? 'Calculando...' : 'Cotar'}
                </button>
              </form>

              {erroFrete && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs">
                  {erroFrete}
                </div>
              )}

              {resultadoFrete && (
                <div className="space-y-3 pt-2 animate-fade-in">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <p className="font-bold text-slate-800 dark:text-white">Endereço Identificado:</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      {resultadoFrete.endereco?.logradouro ? `${resultadoFrete.endereco.logradouro}, ` : ''}
                      {resultadoFrete.endereco?.bairro ? `${resultadoFrete.endereco.bairro} - ` : ''}
                      {resultadoFrete.endereco?.localidade}/{resultadoFrete.endereco?.uf} (CEP: {resultadoFrete.endereco?.cep})
                    </p>
                  </div>

                  <div className="space-y-2">
                    {resultadoFrete.opcoes?.map((op: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          {op.tipo === 'motoboy' && <Bike className="w-5 h-5 text-indigo-500" />}
                          {op.tipo === 'sedex' && <Truck className="w-5 h-5 text-blue-500" />}
                          {op.tipo === 'pac' && <Truck className="w-5 h-5 text-amber-500" />}
                          {op.tipo === 'retirada' && <MapPin className="w-5 h-5 text-emerald-500" />}

                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">{op.titulo}</p>
                            <p className="text-[11px] text-slate-400">{op.prazo}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {op.valor === 0 ? 'GRÁTIS' : `R$ ${op.valor.toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <a
                    href={criarLinkWhatsApp(
                      `Olá Manu! 🛵 Simulei o frete para o meu CEP *${cepDestino}* (${resultadoFrete.endereco?.bairro || ''} - ${resultadoFrete.endereco?.localidade || ''}). Quero fazer um pedido com entrega!`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Pedir pelo WhatsApp com esse CEP</span>
                  </a>
                </div>
              )}
            </div>

            {/* Formas de Pagamento Aceitas */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                Formas de Pagamento Oficiais:
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">PIX Instantâneo</p>
                    <p className="text-[10px] text-slate-400">Baixa automática 24h</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-500" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Cartão até 12x</p>
                    <p className="text-[10px] text-slate-400">Checkout Mercado Pago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé do Catálogo */}
        <footer className="pt-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <p>© {new Date().getFullYear()} {dados?.nomeEmpresa || 'Studio Bella'} • Todos os direitos reservados.</p>
          <p className="text-[11px]">
            Desenvolvido com <strong>Recepcionista Pro AI</strong> • Tecnologia inteligente para clínicas de estética.
          </p>
          <div>
            <a
              href="/"
              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Área Administrativa do Studio →
            </a>
          </div>
        </footer>
      </main>

      {/* Floating CTA WhatsApp Fixo (Mobile First) */}
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 max-w-lg mx-auto z-40 select-none">
        <a
          href={criarLinkWhatsApp('Olá Manu! Estou no catálogo e gostaria de falar com você!')}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-5 rounded-2xl shadow-xl shadow-emerald-900/30 flex items-center justify-between transition-transform active:scale-98 cursor-pointer border border-emerald-400/30 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm leading-tight">Falar com a Manu no WhatsApp</p>
              <p className="text-[10px] text-emerald-100">Atendimento 24h para dúvidas e agendamentos</p>
            </div>
          </div>

          <span className="text-xs font-black bg-white text-emerald-800 px-2.5 py-1 rounded-xl shadow-sm">
            Conversar ✨
          </span>
        </a>
      </div>
    </div>
  );
}
