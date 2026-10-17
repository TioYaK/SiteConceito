'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Servico } from '@/lib/store';

interface ModalNovoAgendamentoProps {
  aberto: boolean;
  onClose: () => void;
  servicos: Servico[];
  onSalvar: (dados: {
    clienteNome: string;
    clienteTelefone: string;
    servicoId: string;
    data: string;
    horario: string;
    sinalPago: boolean;
    observacoes: string;
  }) => void;
}

export function ModalNovoAgendamento({
  aberto,
  onClose,
  servicos,
  onSalvar
}: ModalNovoAgendamentoProps) {
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [servicoId, setServicoId] = useState(servicos[0]?.id || '');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [horario, setHorario] = useState('10:00');
  const [sinalPago, setSinalPago] = useState(true);
  const [observacoes, setObservacoes] = useState('');

  if (!aberto) return null;

  const servicoSelecionado = servicos.find(s => s.id === servicoId) || servicos[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) return;

    onSalvar({
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || '5511999999999',
      servicoId: servicoSelecionado.id,
      data,
      horario,
      sinalPago,
      observacoes: observacoes.trim()
    });

    setClienteNome('');
    setClienteTelefone('');
    setObservacoes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Marcar Horário na Agenda</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adicionar atendimento manualmente</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nome da Cliente */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nome da Cliente
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Beatriz Lima"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Telefone / WhatsApp */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              WhatsApp da Cliente (com DDD)
            </label>
            <input
              type="tel"
              placeholder="(11) 99999-8888"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Seleção do Serviço */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Procedimento / Serviço
            </label>
            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} - R$ {s.precoTotal.toFixed(2).replace('.', ',')} ({s.duracaoMinutos} min)
                </option>
              ))}
            </select>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Horário
              </label>
              <input
                type="time"
                required
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Status do Sinal PIX */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Sinal de R$ {servicoSelecionado?.valorSinal.toFixed(2).replace('.', ',')}:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSinalPago(true)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  sinalPago
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Já Pago (Garantido)</span>
              </button>

              <button
                type="button"
                onClick={() => setSinalPago(false)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                  !sinalPago
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>Aguardar PIX</span>
              </button>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Alérgica a esmalte, prefere curvatura D..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition cursor-pointer mt-2"
          >
            Confirmar Horário na Agenda ✨
          </button>
        </form>
      </div>
    </div>
  );
}
