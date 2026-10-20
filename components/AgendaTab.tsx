'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Check, 
  X, 
  Copy, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CalendarDays,
  ListFilter,
  CreditCard,
  Send,
  ExternalLink
} from 'lucide-react';
import { Agendamento } from '@/lib/store';

interface AgendaTabProps {
  agendamentos: Agendamento[];
  onConfirmarSinal: (id: string) => void;
  onConcluirAtendimento: (id: string, formaPagamento: string) => void;
  onCancelar: (id: string) => void;
  onNovoAgendamento: () => void;
}

type ModoVisualizacao = 'mes' | 'semana' | 'hoje' | 'todos';

export function AgendaTab({
  agendamentos,
  onConfirmarSinal,
  onConcluirAtendimento,
  onCancelar,
  onNovoAgendamento
}: AgendaTabProps) {
  const dataHojeObj = new Date();
  const dataHojeStr = dataHojeObj.toISOString().split('T')[0];

  const [modo, setModo] = useState<ModoVisualizacao>('mes');
  const [dataSelecionada, setDataSelecionada] = useState<string>(dataHojeStr);
  const [mesAtual, setMesAtual] = useState<Date>(new Date(dataHojeObj.getFullYear(), dataHojeObj.getMonth(), 1));
  const [modalConcluirId, setModalConcluirId] = useState<string | null>(null);
  const [formaPgtoRestante, setFormaPgtoRestante] = useState<'pix' | 'cartao_credito' | 'dinheiro'>('pix');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estados do Link Mercado Pago
  const [modalMpAgendamentoAberto, setModalMpAgendamentoAberto] = useState(false);
  const [gerandoMpAgendamento, setGerandoMpAgendamento] = useState(false);
  const [linkMpAgendamento, setLinkMpAgendamento] = useState<string | null>(null);
  const [agendamentoSelecionadoMp, setAgendamentoSelecionadoMp] = useState<Agendamento | null>(null);
  const [tipoValorMp, setTipoValorMp] = useState<'sinal' | 'total'>('sinal');
  const [linkMpAgendamentoCopiado, setLinkMpAgendamentoCopiado] = useState(false);

  const handleGerarLinkMpAgendamento = async (agendamento: Agendamento, tipoValor: 'sinal' | 'total' = 'sinal') => {
    setGerandoMpAgendamento(true);
    setAgendamentoSelecionadoMp(agendamento);
    setTipoValorMp(tipoValor);
    setLinkMpAgendamento(null);
    setLinkMpAgendamentoCopiado(false);
    setModalMpAgendamentoAberto(true);

    const valorCobrar = tipoValor === 'sinal' ? agendamento.valorSinal : agendamento.valorTotal;
    const desc = tipoValor === 'sinal' 
      ? `Sinal Reserva - ${agendamento.servicoNome} (${agendamento.clienteNome})` 
      : `Procedimento ${agendamento.servicoNome} (${agendamento.clienteNome})`;

    try {
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'criar_link_pagamento',
          valor: valorCobrar,
          titulo: desc,
          clienteNome: agendamento.clienteNome,
          clienteTelefone: agendamento.clienteTelefone,
          referenciaId: agendamento.id
        })
      });
      const data = await res.json();
      if (res.ok && data.linkPagamento) {
        setLinkMpAgendamento(data.linkPagamento);
      } else {
        alert(data.error || 'Erro ao gerar link do Mercado Pago.');
      }
    } catch {
      alert('Erro de conexão ao gerar link do Mercado Pago.');
    } finally {
      setGerandoMpAgendamento(false);
    }
  };

  const copiarLinkMp = (link: string) => {
    navigator.clipboard.writeText(link);
    setLinkMpAgendamentoCopiado(true);
    setTimeout(() => setLinkMpAgendamentoCopiado(false), 2500);
  };

  const avancarMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  };

  const voltarMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  };

  const irParaHoje = () => {
    const hoje = new Date();
    setMesAtual(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    setDataSelecionada(dataHojeStr);
    setModo('hoje');
  };

  const ano = mesAtual.getFullYear();
  const mesIndex = mesAtual.getMonth();

  const primeiroDiaSemana = new Date(ano, mesIndex, 1).getDay();
  const ultimoDiaMes = new Date(ano, mesIndex + 1, 0).getDate();
  const ultimoDiaMesAnterior = new Date(ano, mesIndex, 0).getDate();

  const celulasCalendario = [];

  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const diaNum = ultimoDiaMesAnterior - i;
    const mesAntIndex = mesIndex === 0 ? 11 : mesIndex - 1;
    const anoAnt = mesIndex === 0 ? ano - 1 : ano;
    const dataIso = `${anoAnt}-${String(mesAntIndex + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
    celulasCalendario.push({ dia: diaNum, dataIso, outroMes: true });
  }

  for (let d = 1; d <= ultimoDiaMes; d++) {
    const dataIso = `${ano}-${String(mesIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celulasCalendario.push({ dia: d, dataIso, outroMes: false });
  }

  const diasRestantes = 42 - celulasCalendario.length;
  for (let d = 1; d <= diasRestantes; d++) {
    const mesProxIndex = mesIndex === 11 ? 0 : mesIndex + 1;
    const anoProx = mesIndex === 11 ? ano + 1 : ano;
    const dataIso = `${anoProx}-${String(mesProxIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celulasCalendario.push({ dia: d, dataIso, outroMes: true });
  }

  const agendamentosPorData = agendamentos.reduce((acc, a) => {
    if (!acc[a.data]) acc[a.data] = [];
    acc[a.data].push(a);
    return acc;
  }, {} as Record<string, Agendamento[]>);

  const agendamentosExibidos = agendamentos.filter(a => {
    if (modo === 'hoje') return a.data === dataHojeStr;
    if (modo === 'mes') return a.data === dataSelecionada;
    if (modo === 'semana') {
      const dataSelObj = new Date(dataSelecionada + 'T00:00:00');
      const diaSemana = dataSelObj.getDay();
      const inicioSemana = new Date(dataSelObj);
      inicioSemana.setDate(dataSelObj.getDate() - diaSemana);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      const aDataObj = new Date(a.data + 'T00:00:00');
      return aDataObj >= inicioSemana && aDataObj <= fimSemana;
    }
    return true;
  }).sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horario.localeCompare(b.horario);
  });

  const agendamentosDoMesAtual = agendamentos.filter(a => {
    const [aAno, aMes] = a.data.split('-').map(Number);
    return aAno === ano && aMes === (mesIndex + 1);
  });

  const faturamentoMes = agendamentosDoMesAtual
    .filter(a => a.status !== 'cancelado')
    .reduce((acc, a) => acc + a.valorTotal, 0);

  const sinaisGarantidosMes = agendamentosDoMesAtual
    .filter(a => a.sinalPago && a.status !== 'cancelado')
    .reduce((acc, a) => acc + a.valorSinal, 0);

  const formatarDataCabecalho = (dataIso: string) => {
    try {
      const [y, m, d] = dataIso.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }).format(dt);
    } catch {
      return dataIso;
    }
  };

  const copiarPix = (codigo: string, id: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const abrirWhatsApp = (agendamento: Agendamento) => {
    const tel = agendamento.clienteTelefone.replace(/\D/g, '');
    if (tel.length > 13) {
      alert(`O agendamento de "${agendamento.clienteNome}" foi registrado via WhatsApp com ID de privacidade (${tel}). O número oficial com DDD pode ser completado na aba Clientes.`);
      return;
    }
    let msg = '';

    if (agendamento.status === 'aguardando_sinal') {
      msg = `Oi ${agendamento.clienteNome}, tudo bem? 🌸 Aqui é do Studio! Reservamos seu horário para ${agendamento.servicoNome} no dia ${agendamento.data.split('-').reverse().join('/')} às ${agendamento.horario}. Para confirmar a vaga, segue a chave PIX do sinal de R$ ${agendamento.valorSinal.toFixed(2).replace('.', ',')}:\n\n${agendamento.pixCodigo || '11987654321'}\n\nAssim que fizer, só me mandar o comprovante por aqui!`;
    } else {
      msg = `Oi ${agendamento.clienteNome}, tudo bem? 💖 Passando para confirmar seu horário de *${agendamento.servicoNome}* às *${agendamento.horario}*! Lembrando de vir sem maquiagem ou rímel nos olhos para melhor fixação. Te esperamos com muito carinho! ✨`;
    }

    const url = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const agendamentoParaConcluir = agendamentos.find(a => a.id === modalConcluirId);

  const nomeMesFormatado = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(mesAtual);

  return (
    <div className="space-y-4 pb-20">
      {/* 3 Cartões de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-3xl p-4 text-white shadow-md shadow-emerald-200/40 dark:shadow-none col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                Faturamento do Mês
              </span>
              <span className="text-[11px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg capitalize font-bold">
                {new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(mesAtual)}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-1">
              R$ {faturamentoMes.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <p className="text-[11px] text-emerald-100/90 font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>R$ {sinaisGarantidosMes.toFixed(2).replace('.', ',')} seguros em sinais PIX</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Atendimentos no Mês</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{agendamentosDoMesAtual.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {agendamentosDoMesAtual.filter(a => a.sinalPago).length} confirmados com sinal
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hoje ({new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(dataHojeObj)})</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {(agendamentosPorData[dataHojeStr] || []).length} clientes
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            {(agendamentosPorData[dataHojeStr] || []).filter(a => a.sinalPago).length} já com sinal pago
          </p>
        </div>
      </div>

      {/* Barra de Seleção de Modo */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-1 transition-colors">
        <div className="grid grid-cols-4 gap-1 w-full sm:w-auto sm:flex sm:items-center">
          <button
            onClick={() => setModo('mes')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              modo === 'mes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Mês</span>
          </button>

          <button
            onClick={() => setModo('semana')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              modo === 'semana'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Semana</span>
          </button>

          <button
            onClick={irParaHoje}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              modo === 'hoje'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hoje</span>
          </button>

          <button
            onClick={() => setModo('todos')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              modo === 'todos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Todos</span>
          </button>
        </div>

        <button
          onClick={onNovoAgendamento}
          className="hidden sm:flex items-center gap-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
        >
          <span>+ Marcar Horário</span>
        </button>
      </div>

      {/* VISÃO 1: GRADE MENSAL */}
      {modo === 'mes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg capitalize">
                {nomeMesFormatado}
              </h3>
              <button
                onClick={irParaHoje}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition cursor-pointer border border-emerald-200/50 dark:border-emerald-800/50"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={voltarMes}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={avancarMes}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((diaSemana, idx) => (
              <span
                key={diaSemana}
                className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
                  idx === 0 || idx === 6 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {diaSemana}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {celulasCalendario.map((celula, idx) => {
              const ehHoje = celula.dataIso === dataHojeStr;
              const ehSelecionado = celula.dataIso === dataSelecionada;
              const agsDoDia = agendamentosPorData[celula.dataIso] || [];
              const temAgendamento = agsDoDia.length > 0;
              const temAguardandoSinal = agsDoDia.some(a => a.status === 'aguardando_sinal');

              return (
                <button
                  key={`${celula.dataIso}-${idx}`}
                  onClick={() => setDataSelecionada(celula.dataIso)}
                  className={`min-h-[58px] sm:min-h-[72px] p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    ehSelecionado
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500 shadow-sm'
                      : celula.outroMes
                      ? 'border-transparent bg-slate-50/50 dark:bg-slate-900/30 text-slate-300 dark:text-slate-700'
                      : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center leading-none ${
                        ehHoje
                          ? 'bg-emerald-600 text-white font-black'
                          : ehSelecionado
                          ? 'text-emerald-800 dark:text-emerald-300 font-black'
                          : celula.outroMes
                          ? 'text-slate-300 dark:text-slate-700'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {celula.dia}
                    </span>

                    {temAgendamento && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {agsDoDia.length}
                      </span>
                    )}
                  </div>

                  {temAgendamento ? (
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          temAguardandoSinal ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="hidden sm:inline text-[10px] font-semibold truncate text-slate-600 dark:text-slate-400">
                        {agsDoDia[0].servicoNome.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="h-2"></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmado com Sinal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Aguardando PIX
              </span>
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Clique em qualquer dia para ver os horários
            </span>
          </div>
        </div>
      )}

      {/* VISÃO 2: SEMANAL */}
      {modo === 'semana' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Visualização Semanal</h4>
            <span className="text-xs text-slate-400">7 dias</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const dataSelObj = new Date(dataSelecionada + 'T00:00:00');
              const diaSemana = dataSelObj.getDay();
              const d = new Date(dataSelObj);
              d.setDate(dataSelObj.getDate() - diaSemana + i);
              const dIso = d.toISOString().split('T')[0];
              const ehSelecionado = dIso === dataSelecionada;
              const ags = agendamentosPorData[dIso] || [];

              return (
                <button
                  key={dIso}
                  onClick={() => setDataSelecionada(dIso)}
                  className={`p-2.5 rounded-2xl text-center border transition cursor-pointer flex flex-col justify-between min-h-[75px] ${
                    ehSelecionado
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 dark:shadow-none'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase ${ehSelecionado ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d)}
                  </span>
                  <span className="text-base font-black my-0.5">
                    {d.getDate()}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    ehSelecionado
                      ? 'bg-white/20 text-white'
                      : ags.length > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'text-slate-400'
                  }`}>
                    {ags.length} {ags.length === 1 ? 'cliente' : 'clientes'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DETALHES DO DIA SELECIONADO */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg capitalize flex items-center gap-2">
              <span>{formatarDataCabecalho(dataSelecionada)}</span>
              {dataSelecionada === dataHojeStr && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full lowercase">
                  hoje
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {agendamentosExibidos.length} {agendamentosExibidos.length === 1 ? 'atendimento marcado' : 'atendimentos marcados'}
            </p>
          </div>

          <button
            onClick={onNovoAgendamento}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-200 dark:shadow-none transition cursor-pointer"
          >
            <span>+ Marcar Neste Dia</span>
          </button>
        </div>

        {agendamentosExibidos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 transition-colors">
            <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">Nenhum atendimento neste dia</h4>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs mx-auto">
              A agenda está livre. Quando uma cliente agendar pelo WhatsApp ou você marcar, ela aparece aqui!
            </p>
            <button
              onClick={onNovoAgendamento}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow cursor-pointer"
            >
              + Marcar Atendimento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentosExibidos.map((a) => {
              const isConfirmado = a.status === 'confirmado';
              const isAguardando = a.status === 'aguardando_sinal';
              const isConcluido = a.status === 'concluido';
              const isCancelado = a.status === 'cancelado';

              return (
                <div
                  key={a.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border transition-all shadow-sm ${
                    isConfirmado
                      ? 'border-emerald-200 dark:border-emerald-800/60 ring-1 ring-emerald-100 dark:ring-emerald-950/40'
                      : isAguardando
                      ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20'
                      : isConcluido
                      ? 'border-slate-200 dark:border-slate-800 opacity-80'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-2.5 text-center flex-shrink-0 min-w-[65px]">
                        <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto mb-0.5" />
                        <span className="font-black text-slate-800 dark:text-white text-base block leading-none">
                          {a.horario}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">
                          {a.duracaoMinutos} min
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
                            {a.clienteNome}
                          </h4>
                          {a.criadoVia === 'whatsapp_ia' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-md font-bold">
                              <Sparkles className="w-2.5 h-2.5" /> Recepcionista IA
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                          <span>✨ {a.servicoNome}</span>
                        </p>

                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Total: <strong className="text-slate-700 dark:text-slate-300">R$ {a.valorTotal.toFixed(2).replace('.', ',')}</strong>
                          {a.sinalPago ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1.5">
                              (R$ {a.valorSinal.toFixed(2).replace('.', ',')} pago no sinal)
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1.5">
                              (Sinal de R$ {a.valorSinal.toFixed(2).replace('.', ',')} pendente)
                            </span>
                          )}
                        </p>

                        {a.observacoes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg mt-2 border border-slate-100 dark:border-slate-800 italic">
                            "{a.observacoes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {isConfirmado && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Sinal Pago ✅
                        </span>
                      )}

                      {isAguardando && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Aguardando PIX
                        </span>
                      )}

                      {isConcluido && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" /> Concluído
                        </span>
                      )}

                      {isCancelado && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2.5 py-1 rounded-full">
                          Cancelado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => abrirWhatsApp(a)}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
                        title="Abrir WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chamar no Zap</span>
                      </button>

                      {isAguardando && (
                        <>
                          <button
                            onClick={() => copiarPix(a.pixCodigo || '11987654321', a.id)}
                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            {copiadoId === a.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar PIX</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onConfirmarSinal(a.id)}
                            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm shadow-amber-200 dark:shadow-none"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar PIX</span>
                          </button>

                          <button
                            onClick={() => handleGerarLinkMpAgendamento(a, 'sinal')}
                            className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
                            title="Gerar Link de Pagamento do Sinal no Cartão ou PIX"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cartão 12x</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isConcluido && !isCancelado && (
                        <>
                          <button
                            onClick={() => setModalConcluirId(a.id)}
                            className="inline-flex items-center gap-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Finalizar & Caixa</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Deseja cancelar o horário de ${a.clienteNome}?`)) {
                                onCancelar(a.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Finalização do Atendimento */}
      {agendamentoParaConcluir && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Finalizar Atendimento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{agendamentoParaConcluir.clienteNome}</p>
              </div>
              <button
                onClick={() => setModalConcluirId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl p-3 border border-emerald-100 dark:border-emerald-800/60">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>Valor Total do Serviço:</span>
                <span className="font-bold">R$ {agendamentoParaConcluir.valorTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                <span>Sinal Pago no PIX:</span>
                <span className="font-bold">- R$ {(agendamentoParaConcluir.sinalPago ? agendamentoParaConcluir.valorSinal : 0).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 mt-2 border-t border-emerald-200 dark:border-emerald-800/80">
                <span>Restante no Balcão:</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  R$ {Math.max(0, agendamentoParaConcluir.valorTotal - (agendamentoParaConcluir.sinalPago ? agendamentoParaConcluir.valorSinal : 0)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Forma de pagamento do restante:
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
                    onClick={() => setFormaPgtoRestante(opcao.id as any)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                      formaPgtoRestante === opcao.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opcao.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                onConcluirAtendimento(agendamentoParaConcluir.id, formaPgtoRestante);
                setModalConcluirId(null);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition cursor-pointer"
            >
              Confirmar e Lançar no Caixa ✨
            </button>
          </div>
        </div>
      )}

      {/* MODAL LINK MERCADO PAGO DO AGENDAMENTO */}
      {modalMpAgendamentoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Link Mercado Pago</h3>
                  <p className="text-xs text-slate-400">Parcelamento no Cartão ou PIX</p>
                </div>
              </div>
              <button
                onClick={() => setModalMpAgendamentoAberto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {gerandoMpAgendamento ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Gerando Link no Mercado Pago...
                </p>
              </div>
            ) : linkMpAgendamento ? (
              <div className="space-y-3.5">
                {agendamentoSelecionadoMp && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
                      <span>Cliente: {agendamentoSelecionadoMp.clienteNome}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        R$ {(tipoValorMp === 'sinal' ? agendamentoSelecionadoMp.valorSinal : agendamentoSelecionadoMp.valorTotal).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {tipoValorMp === 'sinal' ? 'Sinal de Reserva' : 'Valor Total'} • {agendamentoSelecionadoMp.servicoNome} ({agendamentoSelecionadoMp.data.split('-').reverse().join('/')} às {agendamentoSelecionadoMp.horario})
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Link de Pagamento Gerado:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={linkMpAgendamento}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white select-all"
                    />
                    <button
                      onClick={() => copiarLinkMp(linkMpAgendamento)}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      {linkMpAgendamentoCopiado ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {agendamentoSelecionadoMp && (
                    <a
                      href={`https://wa.me/${agendamentoSelecionadoMp.clienteTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${agendamentoSelecionadoMp.clienteNome}! ✨\n\nSegue seu link oficial do Studio para confirmação do seu horário de *${agendamentoSelecionadoMp.servicoNome}*:\n👉 ${linkMpAgendamento}\n\nVocê pode parcelar no cartão ou pagar via PIX com confirmação imediata! 🌸`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Link no WhatsApp da Cliente</span>
                    </a>
                  )}

                  <a
                    href={linkMpAgendamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Testar e Abrir Checkout</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-rose-500">
                Não foi possível gerar o link de pagamento.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
