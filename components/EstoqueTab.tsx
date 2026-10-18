'use client';

import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  X,
  Search,
  ShoppingBag,
  Boxes,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Tag,
  DollarSign
} from 'lucide-react';
import { ItemEstoque } from '@/lib/store';

interface EstoqueTabProps {
  estoque: ItemEstoque[];
  onAjustarQuantidade: (id: string, delta: number) => void;
  onNovoItem: (item: Partial<ItemEstoque>) => void;
}

export function EstoqueTab({ estoque, onAjustarQuantidade, onNovoItem }: EstoqueTabProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroAba, setFiltroAba] = useState<'todos' | 'venda' | 'insumo' | 'alerta'>('todos');
  const [busca, setBusca] = useState('');
  const [itemExpandidoId, setItemExpandidoId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Formulário do Modal
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [minimoAlerta, setMinimoAlerta] = useState('2');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [tipo, setTipo] = useState<'insumo_uso' | 'venda_balcao'>('venda_balcao');
  const [precoVenda, setPrecoVenda] = useState('');
  const [categoria, setCategoria] = useState('Cílios & Olhos');
  const [descricao, setDescricao] = useState('');
  const [beneficios, setBeneficios] = useState('');
  const [modoUso, setModoUso] = useState('');

  const itensEmAlerta = estoque.filter(item => item.quantidade <= item.minimoAlerta);
  const produtosVenda = estoque.filter(item => item.tipo === 'venda_balcao');
  const insumosInternos = estoque.filter(item => item.tipo === 'insumo_uso');

  const valorTotalInvestido = estoque.reduce((acc, item) => acc + (item.quantidade * item.custoUnitario), 0);
  const faturamentoPotencial = produtosVenda.reduce((acc, item) => acc + (item.quantidade * (item.precoVenda || 0)), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onNovoItem({
      nome: nome.trim(),
      quantidade: parseInt(quantidade) || 0,
      minimoAlerta: parseInt(minimoAlerta) || 2,
      custoUnitario: parseFloat(custoUnitario.replace(',', '.')) || 0,
      tipo,
      precoVenda: tipo === 'venda_balcao' && precoVenda ? parseFloat(precoVenda.replace(',', '.')) : undefined,
      categoria: tipo === 'venda_balcao' ? categoria : undefined,
      descricao: tipo === 'venda_balcao' && descricao.trim() ? descricao.trim() : undefined,
      beneficios: tipo === 'venda_balcao' && beneficios.trim() ? beneficios.trim() : undefined,
      modoUso: tipo === 'venda_balcao' && modoUso.trim() ? modoUso.trim() : undefined
    });

    setNome('');
    setQuantidade('1');
    setMinimoAlerta('2');
    setCustoUnitario('');
    setPrecoVenda('');
    setDescricao('');
    setBeneficios('');
    setModoUso('');
    setModalAberto(false);
  };

  const copiarRecomendacaoWhatsApp = (item: ItemEstoque) => {
    let msg = `🌸 *${item.nome}* 🌸\n\n`;
    if (item.descricao) msg += `${item.descricao}\n\n`;
    if (item.beneficios) msg += `✨ *Benefícios comprovados:*\n${item.beneficios}\n\n`;
    if (item.modoUso) msg += `🧴 *Como usar em casa:*\n${item.modoUso}\n\n`;
    if (item.precoVenda) msg += `💰 *Valor especial:* R$ ${item.precoVenda.toFixed(2).replace('.', ',')}\n`;
    msg += `🛵 Entregamos por motoboy no mesmo dia ou você retira aqui no Studio!`;

    navigator.clipboard.writeText(msg);
    setCopiadoId(item.id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  // Filtragem dos itens
  const itensFiltrados = estoque.filter(item => {
    if (filtroAba === 'venda' && item.tipo !== 'venda_balcao') return false;
    if (filtroAba === 'insumo' && item.tipo !== 'insumo_uso') return false;
    if (filtroAba === 'alerta' && item.quantidade > item.minimoAlerta) return false;

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchNome = item.nome.toLowerCase().includes(termo);
      const matchCat = item.categoria?.toLowerCase().includes(termo);
      const matchDesc = item.descricao?.toLowerCase().includes(termo);
      return matchNome || matchCat || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Resumo Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Investido em Estoque
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1">
            R$ {valorTotalInvestido.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            {estoque.length} itens no cadastro
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" /> Faturamento Estimado
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            R$ {faturamentoPotencial.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            {produtosVenda.length} produtos de revenda
          </p>
        </div>

        <div className={`rounded-3xl p-4 border shadow-sm flex flex-col justify-between transition-colors ${
          itensEmAlerta.length > 0 
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Alerta de Compra
            </p>
            {itensEmAlerta.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <p className={`text-xl sm:text-2xl font-black mt-1 ${itensEmAlerta.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {itensEmAlerta.length} {itensEmAlerta.length === 1 ? 'item' : 'itens'}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {itensEmAlerta.length > 0 ? 'Repor logo!' : 'Estoque abastecido'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-4 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm flex flex-col justify-between transition-colors">
          <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Manu (IA) Conectada
          </p>
          <p className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
            100% Sincronizado
          </p>
          <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400 font-medium mt-1">
            A IA vende produtos no Zap
          </p>
        </div>
      </div>

      {/* Barra de Filtros, Busca e Botão de Cadastro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Abas */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos', count: estoque.length },
            { id: 'venda', label: '🛍️ Venda WhatsApp & Balcão', count: produtosVenda.length },
            { id: 'insumo', label: '📦 Insumos Internos', count: insumosInternos.length },
            { id: 'alerta', label: '⚠️ Alerta de Reposição', count: itensEmAlerta.length }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroAba(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                filtroAba === f.id
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filtroAba === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Busca e Novo Item */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar item ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <button
            onClick={() => {
              setTipo('venda_balcao');
              setNome('');
              setCustoUnitario('');
              setPrecoVenda('');
              setDescricao('');
              setBeneficios('');
              setModoUso('');
              setModalAberto(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer whitespace-nowrap"
            title="Cadastrar produto que vai aparecer no Catálogo Online da Bio e na IA Manu"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Produto p/ Catálogo</span>
          </button>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="space-y-2.5">
        {itensFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum produto encontrado neste filtro</p>
            <p className="text-xs text-slate-400">Tente buscar por outro termo ou cadastre um novo produto acima.</p>
          </div>
        ) : (
          itensFiltrados.map((item) => {
            const emFalta = item.quantidade <= item.minimoAlerta;
            const isVenda = item.tipo === 'venda_balcao';
            const isExpandido = itemExpandidoId === item.id;
            const temInfoIa = item.descricao || item.beneficios || item.modoUso;
            const lucroUnitario = isVenda && item.precoVenda ? item.precoVenda - item.custoUnitario : 0;
            const margemLucro = isVenda && item.precoVenda && item.custoUnitario > 0 
              ? Math.round((lucroUnitario / item.custoUnitario) * 100) 
              : 0;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border transition-all shadow-sm space-y-3 ${
                  emFalta 
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 ring-1 ring-rose-100 dark:ring-rose-900/40' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      emFalta 
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                        : isVenda
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isVenda ? <ShoppingBag className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                          {item.nome}
                        </h4>

                        {item.categoria && (
                          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {item.categoria}
                          </span>
                        )}

                        {emFalta && (
                          <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full uppercase">
                            Acabando! ⚠️
                          </span>
                        )}

                        {isVenda && temInfoIa && (
                          <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-indigo-200/60 dark:border-indigo-800/60">
                            <Sparkles className="w-2.5 h-2.5" /> Manu (IA) treinada
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {isVenda ? (
                          <>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              Venda: R$ {item.precoVenda?.toFixed(2).replace('.', ',')}
                            </span>
                            <span>•</span>
                            <span>Custo: R$ {item.custoUnitario.toFixed(2).replace('.', ',')}</span>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              Lucro: R$ {lucroUnitario.toFixed(2).replace('.', ',')} (+{margemLucro}%)
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Uso em Procedimentos Internos</span>
                            <span>•</span>
                            <span>Custo Unitário: R$ {item.custoUnitario.toFixed(2).replace('.', ',')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Controle de Quantidade */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onAjustarQuantidade(item.id, -1)}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                      title="Diminuir"
                    >
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <div className="text-center min-w-[32px]">
                      <span className={`text-base font-black ${emFalta ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                        {item.quantidade}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block -mt-1 font-semibold">un</span>
                    </div>

                    <button
                      onClick={() => onAjustarQuantidade(item.id, 1)}
                      className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 dark:hover:bg-emerald-900 active:scale-90 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold transition cursor-pointer"
                      title="Aumentar"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Área Expansível para Detalhes de Home-Care / Manu IA */}
                {isVenda && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setItemExpandidoId(isExpandido ? null : item.id)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isExpandido ? 'Ocultar Detalhes & Roteiro da IA' : 'Ver Como a Manu (IA) Explica Esse Produto'}</span>
                      {isExpandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => copiarRecomendacaoWhatsApp(item)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-sm border border-emerald-200/50 dark:border-emerald-800/50"
                    >
                      {copiadoId === item.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Pitch WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Conteúdo Expandido */}
                {isVenda && isExpandido && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2 animate-fade-in">
                    {item.descricao && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                          Descrição / Apresentação:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {item.descricao}
                        </p>
                      </div>
                    )}

                    {item.beneficios && (
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Benefícios Persuasivos:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {item.beneficios}
                        </p>
                      </div>
                    )}

                    {item.modoUso && (
                      <div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[11px] uppercase tracking-wider">
                          Modo de Uso Sugerido à Cliente:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {item.modoUso}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Cadastro de Produto / Insumo */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Novo Item no Catálogo & Estoque</h3>
                <p className="text-xs text-slate-400">Produtos para venda balcão/WhatsApp são automaticamente aprendidos pela Manu (IA).</p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Seleção do Tipo */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Qual é o objetivo deste item?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('venda_balcao')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                      tipo === 'venda_balcao'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShoppingBag className={`w-5 h-5 shrink-0 ${tipo === 'venda_balcao' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-xs font-bold ${tipo === 'venda_balcao' ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        Venda WhatsApp / Balcão
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Home-Care, séruns, espumas pós-procedimento.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipo('insumo_uso')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                      tipo === 'insumo_uso'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Package className={`w-5 h-5 shrink-0 ${tipo === 'insumo_uso' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-xs font-bold ${tipo === 'insumo_uso' ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        Insumo de Uso Interno
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Cola de cílios, agulha, pinça, algodão, luvas.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Banner Informativo de Sincronização com o Catálogo */}
              {tipo === 'venda_balcao' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-emerald-800 dark:text-emerald-200 text-[11px] leading-relaxed">
                      <strong>Sincronização Automática:</strong> Este produto aparecerá imediatamente no <strong>Catálogo Online da Bio</strong> (studiobrunameireles.com.br/catalogo) e a <strong>Manu (IA)</strong> poderá recomendá-lo e vendê-lo no WhatsApp!
                    </span>
                  </div>

                  {/* Sugestões Rápidas de Produtos Populares */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sugestões Rápidas (1 Clique):
                      </span>
                      <span className="text-[10px] text-slate-400">Preenche todos os campos</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setNome('Espuma Higienizadora Especial de Cílios');
                          setCategoria('Cílios & Olhos');
                          setCustoUnitario('18.00');
                          setPrecoVenda('45.00');
                          setQuantidade('10');
                          setMinimoAlerta('3');
                          setDescricao('Espuma formulada com pH fisiológico para limpeza diária das extensões de cílios sem arder os olhos.');
                          setBeneficios('Aumenta a retenção dos cílios em até 2x, remove oleosidade e previne infecções.');
                          setModoUso('Aplicar 1 pump na ponta dos dedos ou pincel macio, massagear os cílios fechados e enxaguar com água.');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-800 font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
                      >
                        🫧 Espuma de Cílios (R$ 45)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNome('Sérum Fortalecedor & Nutritivo de Sobrancelhas');
                          setCategoria('Sobrancelhas');
                          setCustoUnitario('22.00');
                          setPrecoVenda('55.00');
                          setQuantidade('8');
                          setMinimoAlerta('2');
                          setDescricao('Complexo vitamínico e peptídeos botânicos para estimular o crescimento natural dos fios das sobrancelhas.');
                          setBeneficios('Preenche falhas, estimula novos fios, hidrata e previne a queda pós-design ou micropigmentação.');
                          setModoUso('Passar 1 vez ao dia antes de dormir com o aplicador nas sobrancelhas limpas.');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-800 font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
                      >
                        🌿 Sérum de Sobrancelhas (R$ 55)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNome('Gel Modelador & Alinhador Brow Lamination');
                          setCategoria('Sobrancelhas');
                          setCustoUnitario('15.00');
                          setPrecoVenda('38.00');
                          setQuantidade('10');
                          setMinimoAlerta('3');
                          setDescricao('Gel incolor com efeito laminado que mantém as sobrancelhas alinhadas e penteadas o dia todo sem esfarelar.');
                          setBeneficios('Fixação por 24h, efeito brow lamination instantâneo, fórmula leve que não endurece.');
                          setModoUso('Pentear os fios para cima com a escovinha no sentido desejado e aguardar secar.');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-800 font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
                      >
                        ✨ Gel Brow Lamination (R$ 38)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNome('Máscara Facial Calmante Pós-Procedimento');
                          setCategoria('Estética Facial');
                          setCustoUnitario('20.00');
                          setPrecoVenda('49.00');
                          setQuantidade('6');
                          setMinimoAlerta('2');
                          setDescricao('Máscara calmante com camomila, calêndula e ácido hialurônico para regeneração rápida da pele após limpeza profunda.');
                          setBeneficios('Reduz vermelhidão imediata, restaura a barreira cutânea e hidrata profundamente.');
                          setModoUso('Aplicar camada generosa sobre o rosto limpo, deixar agir por 15 minutos e enxaguar.');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-800 font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
                      >
                        🧖‍♀️ Máscara Calmante Facial (R$ 49)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Item:
                </label>
                <input
                  type="text"
                  required
                  placeholder={tipo === 'venda_balcao' ? "Ex: Sérum Nutritivo Cílios & Sobrancelhas" : "Ex: Adesivo Elite HS-16 3ml"}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Quantidade e Alerta */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Quantidade em Estoque:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Alerta de Reposição (Mínimo):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minimoAlerta}
                    onChange={(e) => setMinimoAlerta(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Custo Unitário (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25,00"
                    value={custoUnitario}
                    onChange={(e) => setCustoUnitario(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {tipo === 'venda_balcao' ? (
                  <div>
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                      Preço de Venda (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="55,00"
                      value={precoVenda}
                      onChange={(e) => setPrecoVenda(e.target.value)}
                      className="w-full bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-slate-400 pt-5">
                    Item de uso no procedimento.
                  </div>
                )}
              </div>

              {/* Campos Avançados para Venda Balcão (Alimentam a IA Manu) */}
              {tipo === 'venda_balcao' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Treinamento da Manu (IA WhatsApp)
                    </span>
                    <span className="text-[10px] text-slate-400">Opcional, mas recomendado!</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Categoria do Produto:
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Cílios & Olhos">Cílios & Olhos</option>
                      <option value="Sobrancelhas">Sobrancelhas</option>
                      <option value="Skincare Facial">Skincare Facial / Pós-Procedimento</option>
                      <option value="Acessórios & Cuidados">Acessórios & Cuidados</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Descrição do Produto:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Espuma higienizadora suave com fórmula dermatologicamente testada para prolongar a vida útil das extensões."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Benefícios Principais (argumentos de venda da IA):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Evita proliferação de fungos, aumenta a retenção em até 10 dias, não resseca a pele."
                      value={beneficios}
                      onChange={(e) => setBeneficios(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Modo de Uso Orientado à Cliente:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Usar 1 pump de manhã com pincel macio e enxaguar com água fria."
                      value={modoUso}
                      onChange={(e) => setModoUso(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg transition cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Salvar Produto no Catálogo ✨</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
