'use client';

import React from 'react';
import { Calendar, DollarSign, Scissors, Package, Bot, Users, ShoppingBag } from 'lucide-react';

export type TabType = 'agenda' | 'clientes' | 'pedidos' | 'caixa' | 'servicos' | 'estoque' | 'recepcionista';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  qtdAguardandoSinal: number;
  qtdEstoqueAlerta: number;
  qtdManutencaoAlerta?: number;
  qtdPedidosAlerta?: number;
}

export function BottomNav({
  activeTab,
  onChangeTab,
  qtdAguardandoSinal,
  qtdEstoqueAlerta,
  qtdManutencaoAlerta = 0,
  qtdPedidosAlerta = 0
}: BottomNavProps) {
  const tabs = [
    {
      id: 'agenda' as TabType,
      label: 'Agenda',
      icon: Calendar,
      badge: qtdAguardandoSinal > 0 ? qtdAguardandoSinal : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'clientes' as TabType,
      label: 'Clientes',
      icon: Users,
      badge: qtdManutencaoAlerta > 0 ? qtdManutencaoAlerta : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'pedidos' as TabType,
      label: 'Vendas',
      icon: ShoppingBag,
      badge: qtdPedidosAlerta > 0 ? qtdPedidosAlerta : undefined,
      badgeColor: 'bg-indigo-500 text-white'
    },
    {
      id: 'caixa' as TabType,
      label: 'Caixa',
      icon: DollarSign,
    },
    {
      id: 'servicos' as TabType,
      label: 'Serviços',
      icon: Scissors,
    },
    {
      id: 'estoque' as TabType,
      label: 'Estoque',
      icon: Package,
      badge: qtdEstoqueAlerta > 0 ? qtdEstoqueAlerta : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'recepcionista' as TabType,
      label: 'Manu IA',
      icon: Bot,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-lg transition-colors duration-200 select-none">
      <div className="max-w-xl mx-auto grid grid-cols-7 gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer active:scale-90 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className={`absolute -top-1 -right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] mt-0.5 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
