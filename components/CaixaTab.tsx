'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  QrCode,
  Calendar,
  Sparkles,
  PieChart,
  ShieldCheck,
  X
} from 'lucide-react';
import { TransacaoCaixa } from '@/lib/store';

interface CaixaTabProps {
  transacoes: TransacaoCaixa[];
  onNovaTransacao: (dados: {
    tipo: 'entrada' | 'saida';
    descricao: string;
    valor: number;
    formaPagamento: 'pix' | 'dinheiro' | 'cartao_credito';
    categoria: any;
  }) => void;
}

export function CaixaTab({ transacoes, onNovaTransacao }: CaixaTabProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoModal, setTipoModal] = useState<'entrada' | 'saida'>('saida');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'dinheiro' | 'cartao_credito'>('pix');

  const totalEntradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + t.valor, 0);

  const lucroLiquido = totalEntradas - totalSaidas;

  const totalSinaisRecebidos = transacoes
    .filter(t => t.tipo === 'entrada' && (t.categoria === 'sinal_pix' || t.descricao.toLowerCase().includes('sinal')))
    .reduce((acc, t) => acc + t.valor, 0);

  const totalEmPix = transacoes
    .filter(t => t.tipo === 'entrada' && t.formaPagamento === 'pix')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalEmCartao = transacoes
    .filter(t => t.tipo === 'entrada' && t.formaPagamento === 'cartao_credito')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalEmDinheiro = transacoes
    .filter(t => t.tipo === 'entrada' && t.formaPagamento === 'dinheiro')
    .reduce((acc, t) => acc + t.valor, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !valor) return;

    onNovaTransacao({
      tipo: tipoModal,
      descricao: descricao.trim(),
      valor: parseFloat(valor.replace(',', '.')),
      formaPagamento,
      categoria: tipoModal === 'entrada' ? 'servico_balcao' : 'custo_insumos'
    });

    setDescricao('');
    setValor('');
    setModalAberto(false);
  };

  const formatarData = (dataIso: string) => {
    const data = new Date(dataIso);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 3 Cartões Visuais de Lucratividade */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Lucro Líquido */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-3xl p-5 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                Lucro Limpo no Bolso
              </span>
              <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 text-emerald-100" />
              </span>
            </div>
            <p className="text-3xl font-black mt-2">
              R$ {lucroLiquido.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <p className="text-xs text-emerald-100/90 mt-3 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>R$ {totalSinaisRecebidos.toFixed(2).replace('.', ',')} seguros em sinais PIX</span>
          </p>
        </div>

        {/* Total Entradas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Faturado (Entradas)
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            R$ {totalEntradas.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Sinais PIX + Pagamentos no Balcão
          </p>
        </div>

        {/* Total Saídas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Custos & Despesas (Saídas)
            </span>
            <span className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            R$ {totalSaidas.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-semibold mt-1">
            Colas, fios, produtos e fixos
          </p>
        </div>
      </div>

      {/* Analytics: Métricas Visuais de Desempenho e Meios de Pagamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Distribuição por Meio de Pagamento */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Como Suas Clientes Pagam</span>
            </h4>
            <span className="text-xs text-slate-400">Entradas</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> PIX Instantâneo
                </span>
                <span>R$ {totalEmPix.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${totalEntradas > 0 ? (totalEmPix / totalEntradas) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Cartão de Crédito / Débito
                </span>
                <span>R$ {totalEmCartao.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${totalEntradas > 0 ? (totalEmCartao / totalEntradas) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Dinheiro em Espécie
                </span>
                <span>R$ {totalEmDinheiro.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${totalEntradas > 0 ? (totalEmDinheiro / totalEntradas) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Procedimentos Mais Lucrativos */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Procedimentos Campeões de Lucro</span>
            </h4>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Mais Vendidos</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">1º Extensão de Cílios (Volume)</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">R$ 150,00</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">2º Micropigmentação de Sobrancelhas</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">R$ 380,00</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">3º Limpeza de Pele Profunda</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">R$ 130,00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botões Rápidos */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setTipoModal('saida');
            setModalAberto(true);
          }}
          className="flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 active:scale-98 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 font-bold text-xs sm:text-sm py-3 px-3 rounded-2xl transition cursor-pointer shadow-sm"
        >
          <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar Gasto (Saída)</span>
        </button>

        <button
          onClick={() => {
            setTipoModal('entrada');
            setModalAberto(true);
          }}
          className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 active:scale-98 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60 font-bold text-xs sm:text-sm py-3 px-3 rounded-2xl transition cursor-pointer shadow-sm"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar Entrada</span>
        </button>
      </div>

      {/* Extrato Detalhado */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3 transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center justify-between">
          <span>Histórico de Movimentações</span>
          <span className="text-xs text-slate-400 font-normal">{transacoes.length} lançamentos</span>
        </h3>

        {transacoes.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">
            Nenhuma movimentação registrada no caixa ainda.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transacoes.map((t) => {
              const isEntrada = t.tipo === 'entrada';

              return (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isEntrada 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isEntrada ? (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-tight">
                        {t.descricao}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{formatarData(t.data)}</span>
                        <span>•</span>
                        <span className="capitalize font-medium text-slate-600 dark:text-slate-400">
                          {t.formaPagamento === 'pix' ? 'PIX' : t.formaPagamento === 'dinheiro' ? 'Dinheiro' : 'Cartão'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-black text-sm whitespace-nowrap ${
                      isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isEntrada ? '+' : '-'} R$ {t.valor.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {tipoModal === 'saida' ? 'Registrar Gasto / Compra' : 'Registrar Entrada de Dinheiro'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  O que foi?
                </label>
                <input
                  type="text"
                  required
                  placeholder={tipoModal === 'saida' ? 'Ex: Compra de Henna e Pincéis' : 'Ex: Venda de produto avulso'}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Valor em Reais (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pix', label: 'PIX' },
                    { id: 'cartao_credito', label: 'Cartão' },
                    { id: 'dinheiro', label: 'Dinheiro' }
                  ].map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => setFormaPagamento(opcao.id as any)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                        formaPagamento === opcao.id
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition cursor-pointer mt-2 ${
                  tipoModal === 'saida'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
                }`}
              >
                Salvar Movimentação ✨
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
