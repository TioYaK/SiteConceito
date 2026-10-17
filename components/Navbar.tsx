'use client';

import React from 'react';
import { Sparkles, Plus, Wifi, Sun, Moon, LogOut, User, ExternalLink } from 'lucide-react';

interface NavbarProps {
  nomeEmpresa: string;
  onOpenNovoAgendamento: () => void;
  statusWhatsApp: string;
  temaEscuro: boolean;
  onToggleTema: () => void;
  usuario: { nome: string; email: string; cargo: string } | null;
  onLogout: () => void;
}

export function Navbar({
  nomeEmpresa,
  onOpenNovoAgendamento,
  statusWhatsApp,
  temaEscuro,
  onToggleTema,
  usuario,
  onLogout
}: NavbarProps) {
  const dataHojeFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-2.5 shadow-sm transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2.5">
        {/* Identidade do Negócio */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 dark:shadow-none flex-shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 dark:text-white text-sm sm:text-base leading-tight max-w-[120px] xs:max-w-[170px] sm:max-w-none truncate">
              {nomeEmpresa}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1.5 font-medium">
              <span className="hidden sm:inline">{dataHojeFormatada}</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                <Wifi className="w-2.5 h-2.5" /> WhatsApp Ativo
              </span>
            </p>
          </div>
        </div>

        {/* Lado Direito: Perfil, Alternador de Tema, Botão de Agendamento e Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Link para o Catálogo da Bio */}
          <a
            href="/catalogo"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold transition cursor-pointer"
            title="Abrir Catálogo Digital da Bio do Instagram"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Catálogo Online</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Ícone de Catálogo no Celular */}
          <a
            href="/catalogo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex sm:hidden w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 items-center justify-center transition cursor-pointer active:scale-90"
            title="Abrir Catálogo da Bio"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
          </a>

          {/* Alternador de Tema Claro / Escuro */}
          <button
            onClick={onToggleTema}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 flex items-center justify-center transition cursor-pointer"
            title={temaEscuro ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
          >
            {temaEscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Perfil do Usuário */}
          {usuario && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                {usuario.nome.charAt(0)}
              </div>
              <div className="text-left text-xs leading-none">
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[100px]">
                  {usuario.nome.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  {usuario.cargo.split('&')[0]}
                </span>
              </div>
            </div>
          )}

          {/* Botão de Destaque "+ Marcar Horário" */}
          <button
            onClick={onOpenNovoAgendamento}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-3 sm:px-3.5 py-2 rounded-xl shadow-md shadow-emerald-200 dark:shadow-none transition-all cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Marcar Horário</span>
            <span className="sm:hidden">Novo</span>
          </button>

          {/* Botão de Logout */}
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
