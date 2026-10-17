'use client';

import React, { useState } from 'react';
import { 
  Scissors, 
  Clock, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  DollarSign, 
  Eye, 
  Smile, 
  ShieldCheck,
  X
} from 'lucide-react';
import { Servico } from '@/lib/store';

interface ServicosTabProps {
  servicos: Servico[];
  onNovoServico: (servico: Partial<Servico>) => void;
}

export function ServicosTab({ servicos, onNovoServico }: ServicosTabProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Cílios');
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);
  const [precoTotal, setPrecoTotal] = useState('');
  const [valorSinal, setValorSinal] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !precoTotal) return;

    onNovoServico({
      nome: nome.trim(),
      categoria,
      duracaoMinutos: Number(duracaoMinutos),
      precoTotal: parseFloat(precoTotal.replace(',', '.')),
      valorSinal: parseFloat((valorSinal || '30').replace(',', '.')),
      descricao: descricao.trim() || 'Procedimento profissional personalizado.'
    });

    setNome('');
    setPrecoTotal('');
    setValorSinal('');
    setDescricao('');
    setModalAberto(false);
  };

  const getIconeCategoria = (cat: string) => {
    if (cat.toLowerCase().includes('cílios') || cat.toLowerCase().includes('cilios')) {
      return <Eye className="w-4 h-4 text-pink-500" />;
    }
    if (cat.toLowerCase().includes('sobrancelha')) {
      return <Scissors className="w-4 h-4 text-amber-500" />;
    }
    if (cat.toLowerCase().includes('micropigmentação') || cat.toLowerCase().includes('micro')) {
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
    return <Smile className="w-4 h-4 text-teal-500" />;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white text-base">Tabela de Serviços & Valores</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A recepcionista do WhatsApp usa esses valores e tempos automaticamente.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-emerald-200 dark:shadow-none transition cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Grid de Serviços */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {servicos.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {getIconeCategoria(s.categoria)}
                  <span>{s.categoria}</span>
                </span>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{s.duracaoMinutos} min</span>
                </div>
              </div>

              <h3 className="font-bold text-slate-800 dark:text-white text-base mt-2.5 leading-snug">
                {s.nome}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {s.descricao}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Valor Total
                </p>
                <p className="text-lg font-black text-slate-800 dark:text-white">
                  R$ {s.precoTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center justify-end gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Sinal no PIX
                </p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  R$ {s.valorSinal.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Novo Serviço no Catálogo</h3>
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
                  Nome do Procedimento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Extensão Volume Híbrido"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cílios">Cílios</option>
                    <option value="Sobrancelhas">Sobrancelhas</option>
                    <option value="Brow Lamination">Brow Lamination</option>
                    <option value="Micropigmentação">Micropigmentação</option>
                    <option value="Estética Facial">Limpeza de Pele</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Duração
                  </label>
                  <select
                    value={duracaoMinutos}
                    onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1h (60 min)</option>
                    <option value={90}>1h30 (90 min)</option>
                    <option value={120}>2h (120 min)</option>
                    <option value={150}>2h30 (150 min)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preço Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120,00"
                    value={precoTotal}
                    onChange={(e) => setPrecoTotal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                    Sinal no PIX (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="30,00"
                    value={valorSinal}
                    onChange={(e) => setValorSinal(e.target.value)}
                    className="w-full bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Fios delicados com efeito duradouro..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition cursor-pointer mt-2"
              >
                Cadastrar Serviço ✨
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
