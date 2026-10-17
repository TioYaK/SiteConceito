'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Bike, 
  Truck, 
  Store, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus, 
  MapPin, 
  ExternalLink, 
  Copy, 
  Settings, 
  Calculator, 
  AlertCircle,
  PackageCheck,
  Send,
  X,
  Sparkles,
  DollarSign,
  CreditCard,
  Check
} from 'lucide-react';
import { Pedido, ItemEstoque, FreteConfig } from '@/lib/store';

interface PedidosTabProps {
  pedidos: Pedido[];
  estoque: ItemEstoque[];
  freteConfig?: FreteConfig;
  onConfirmarPix: (pedidoId: string) => void;
  onAtualizarStatus: (pedidoId: string, status: Pedido['status'], rastreio?: string) => void;
  onNovoPedido: (pedido: any) => void;
  onSalvarFreteConfig: (config: FreteConfig) => void;
}

export function PedidosTab({
  pedidos = [],
  estoque = [],
  freteConfig = {
    taxaMotoboy: 15.00,
    cepOrigem: "01310-100",
    cidadeOrigem: "São Paulo",
    estadoOrigem: "SP",
    freteGratisAcimaDe: 150.00,
    permiteRetirada: true,
    permiteMotoboy: true,
    permiteCorreios: true
  },
  onConfirmarPix,
  onAtualizarStatus,
  onNovoPedido,
  onSalvarFreteConfig
}: PedidosTabProps) {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modais
  const [modalFreteAberto, setModalFreteAberto] = useState(false);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalNovoPedidoAberto, setModalNovoPedidoAberto] = useState(false);
  const [modalMpAberto, setModalMpAberto] = useState(false);
  const [gerandoLinkMp, setGerandoLinkMp] = useState(false);
  const [linkMpGerado, setLinkMpGerado] = useState<string | null>(null);
  const [pedidoSelecionadoMp, setPedidoSelecionadoMp] = useState<Pedido | null>(null);
  const [linkMpCopiado, setLinkMpCopiado] = useState(false);

  // Estado da Calculadora de Frete
  const [cepDestino, setCepDestino] = useState('');
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [resultadoFrete, setResultadoFrete] = useState<any>(null);
  const [erroFrete, setErroFrete] = useState('');
  const [cotacaoCopiada, setCotacaoCopiada] = useState(false);

  // Estado do Modal de Configuração de Frete
  const [editConfigFrete, setEditConfigFrete] = useState<FreteConfig>(freteConfig);

  // Estado do Modal de Novo Pedido Manual
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoItemSelecionado, setNovoItemSelecionado] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState(1);
  const [carrinhoItens, setCarrinhoItens] = useState<{ produtoId: string; nome: string; quantidade: number; precoUnitario: number }[]>([]);
  const [novoTipoEntrega, setNovoTipoEntrega] = useState<'retirada' | 'motoboy' | 'correios'>('motoboy');
  const [novoCep, setNovoCep] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [novoBairro, setNovoBairro] = useState('');
  const [novoValorFrete, setNovoValorFrete] = useState<number>(freteConfig.taxaMotoboy);
  const [pedidoJaPago, setPedidoJaPago] = useState(false);

  // Produtos disponíveis para venda balcão
  const produtosVenda = estoque.filter(e => e.tipo === 'venda_balcao');

  // Métricas
  const totalFaturamento = pedidos
    .filter(p => p.pago)
    .reduce((acc, p) => acc + p.valorTotal, 0);

  const qtdAguardandoPix = pedidos.filter(p => p.status === 'aguardando_pix').length;
  const qtdPreparando = pedidos.filter(p => p.status === 'preparando').length;
  const qtdSaiuEntrega = pedidos.filter(p => p.status === 'saiu_entrega').length;
  const qtdEntregue = pedidos.filter(p => p.status === 'entregue').length;

  // Filtragem
  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchNome = p.clienteNome.toLowerCase().includes(termo);
      const matchTelefone = p.clienteTelefone.includes(termo);
      const matchItens = p.itens?.some(i => i.nome.toLowerCase().includes(termo));
      return matchNome || matchTelefone || matchItens;
    }
    return true;
  });

  const copiarPix = (pix: string, id: string) => {
    navigator.clipboard.writeText(pix);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleGerarLinkMercadoPago = async (pedido: Pedido) => {
    setGerandoLinkMp(true);
    setPedidoSelecionadoMp(pedido);
    setLinkMpGerado(null);
    setLinkMpCopiado(false);
    setModalMpAberto(true);

    try {
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'criar_link_pagamento',
          valor: pedido.valorTotal,
          titulo: `Pedido #${pedido.id.substring(0, 8)} - ${pedido.clienteNome}`,
          clienteNome: pedido.clienteNome,
          clienteTelefone: pedido.clienteTelefone,
          referenciaId: pedido.id
        })
      });
      const data = await res.json();
      if (res.ok && data.linkPagamento) {
        setLinkMpGerado(data.linkPagamento);
      } else {
        alert(data.error || 'Não foi possível gerar o link do Mercado Pago.');
      }
    } catch {
      alert('Erro de conexão ao gerar link do Mercado Pago.');
    } finally {
      setGerandoLinkMp(false);
    }
  };

  const copiarLinkMp = (link: string) => {
    navigator.clipboard.writeText(link);
    setLinkMpCopiado(true);
    setTimeout(() => setLinkMpCopiado(false), 2500);
  };

  const handleCalcularFrete = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cepDestino.replace(/\D/g, '');
    if (clean.length !== 8) {
      setErroFrete('Digite um CEP válido com 8 números.');
      return;
    }
    setCalculandoFrete(true);
    setErroFrete('');
    setResultadoFrete(null);

    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: clean, valorCarrinho: 45.00 })
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoFrete(data);
      } else {
        setErroFrete(data.error || 'Erro ao calcular o frete.');
      }
    } catch {
      setErroFrete('Não foi possível consultar os Correios/ViaCEP.');
    } finally {
      setCalculandoFrete(false);
    }
  };

  const copiarTextoCotacaoWhatsApp = () => {
    if (!resultadoFrete) return;
    const end = resultadoFrete.endereco;
    let texto = `Olá! 🌸 Fiz a cotação de entrega para o seu endereço:\n`;
    if (end.logradouro) texto += `📍 *${end.logradouro}, ${end.bairro} - ${end.localidade}/${end.uf}* (CEP: ${end.cep})\n\n`;
    else texto += `📍 *${end.localidade}/${end.uf}* (CEP: ${end.cep})\n\n`;

    texto += `*Opções de Envio:*\n`;
    resultadoFrete.opcoes.forEach((op: any) => {
      const valorStr = op.valor === 0 ? '*GRÁTIS*' : `R$ ${op.valor.toFixed(2).replace('.', ',')}`;
      texto += `• ${op.titulo}: ${valorStr} (${op.prazo})\n`;
    });
    texto += `\nQual das opções fica melhor para você? ✨`;

    navigator.clipboard.writeText(texto);
    setCotacaoCopiada(true);
    setTimeout(() => setCotacaoCopiada(false), 3000);
  };

  const handleAdicionarItemCarrinho = () => {
    if (!novoItemSelecionado) return;
    const prod = produtosVenda.find(p => p.id === novoItemSelecionado);
    if (!prod) return;

    const jaExiste = carrinhoItens.find(i => i.produtoId === prod.id);
    if (jaExiste) {
      setCarrinhoItens(carrinhoItens.map(i => i.produtoId === prod.id ? { ...i, quantidade: i.quantidade + novaQuantidade } : i));
    } else {
      setCarrinhoItens([...carrinhoItens, {
        produtoId: prod.id,
        nome: prod.nome,
        quantidade: novaQuantidade,
        precoUnitario: prod.precoVenda || 45.00
      }]);
    }
    setNovoItemSelecionado('');
    setNovaQuantidade(1);
  };

  const handleRemoverItemCarrinho = (produtoId: string) => {
    setCarrinhoItens(carrinhoItens.filter(i => i.produtoId !== produtoId));
  };

  const totalItensCarrinho = carrinhoItens.reduce((acc, i) => acc + (i.precoUnitario * i.quantidade), 0);
  const totalGeralPedido = totalItensCarrinho + (novoTipoEntrega === 'retirada' ? 0 : novoValorFrete);

  const handleSalvarNovoPedido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoClienteNome.trim() || carrinhoItens.length === 0) return;

    onNovoPedido({
      clienteNome: novoClienteNome.trim(),
      clienteTelefone: novoClienteTelefone.trim() || '5511999998888',
      itens: carrinhoItens,
      tipoEntrega: novoTipoEntrega,
      endereco: novoEndereco,
      bairro: novoBairro,
      cep: novoCep,
      valorItens: totalItensCarrinho,
      valorFrete: novoTipoEntrega === 'retirada' ? 0 : novoValorFrete,
      pago: pedidoJaPago
    });

    // Reset form
    setNovoClienteNome('');
    setNovoClienteTelefone('');
    setCarrinhoItens([]);
    setNovoEndereco('');
    setNovoBairro('');
    setNovoCep('');
    setModalNovoPedidoAberto(false);
  };

  const handleSalvarConfiguracoes = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarFreteConfig(editConfigFrete);
    setModalConfigAberto(false);
  };

  const dispararMensagemEnvioWhatsApp = (pedido: Pedido) => {
    const tel = pedido.clienteTelefone.replace(/\D/g, '');
    let msg = `Olá, ${pedido.clienteNome}! ✨ Seu pedido do Studio já foi separado com muito carinho! `;
    if (pedido.tipoEntrega === 'motoboy') {
      msg += `🛵 Nosso motoboy já saiu para entrega no seu endereço (${pedido.endereco || 'informado'}). Fique atenta ao interfone!`;
    } else if (pedido.tipoEntrega === 'correios') {
      msg += `📦 Seu pedido já foi postado nos Correios! ${pedido.rastreio ? `Código de rastreio: *${pedido.rastreio}*` : 'Em breve te envio o código de rastreio!'}`;
    } else {
      msg += `🏪 Seu produto já está pronto e embalado aqui no Studio para retirada! Pode passar quando quiser.`;
    }

    const url = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Top Header & Métricas de Vendas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Vendas & Entregas
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              WhatsApp & Balcão
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Venda produtos Home-Care pelo WhatsApp, calcule fretes de Motoboy ou Correios e despache com 1 clique!
          </p>
        </div>

        {/* Botões de Ação Topo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalFreteAberto(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Simular Frete</span>
          </button>

          <button
            onClick={() => {
              setEditConfigFrete(freteConfig);
              setModalConfigAberto(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Regras de Envio</span>
          </button>

          <button
            onClick={() => setModalNovoPedidoAberto(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento Vendas</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            R$ {totalFaturamento.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Lucro líquido de produtos
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aguardando PIX</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {qtdAguardandoPix}
          </div>
          <span className="text-[10px] text-slate-400">pedidos aguardando comprovante</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Preparar / Enviar</span>
            <Bike className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {qtdPreparando + qtdSaiuEntrega}
          </div>
          <span className="text-[10px] text-slate-400">
            {qtdPreparando} preparando, {qtdSaiuEntrega} em rota
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Entregas Concluídas</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {qtdEntregue}
          </div>
          <span className="text-[10px] text-slate-400">entregues no local ou correios</span>
        </div>
      </div>

      {/* Banner Informativo de Frete Automático */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Cálculo de Entrega Inteligente via WhatsApp
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Quando a cliente pergunta sobre entrega no WhatsApp ou manda o CEP, a <b>Manu (IA)</b> já passa o valor do Motoboy no mesmo dia (R$ {freteConfig.taxaMotoboy.toFixed(2).replace('.', ',')}), Sedex dos Correios e opção de retirada grátis!
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalFreteAberto(true)}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          Testar com meu CEP
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Abas de Status */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos', count: pedidos.length },
            { id: 'aguardando_pix', label: 'Aguardando PIX', count: qtdAguardandoPix },
            { id: 'preparando', label: 'Preparando', count: qtdPreparando },
            { id: 'saiu_entrega', label: 'Saiu p/ Entrega', count: qtdSaiuEntrega },
            { id: 'entregue', label: 'Entregues', count: qtdEntregue }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filtroStatus === f.id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                filtroStatus === f.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Input de Busca */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente ou produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Lista de Pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum pedido encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Quando as clientes comprarem produtos de Home-Care pelo WhatsApp ou você lançar um pedido balcão, eles aparecerão aqui com status e cálculo de frete!
          </p>
          <button
            onClick={() => setModalNovoPedidoAberto(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Pedido
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {pedidosFiltrados.map((pedido) => {
            const isAguardando = pedido.status === 'aguardando_pix';
            const isPreparando = pedido.status === 'preparando';
            const isSaiuEntrega = pedido.status === 'saiu_entrega';
            const isEntregue = pedido.status === 'entregue';

            return (
              <div
                key={pedido.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Topo do Card: Cliente e Badge de Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {pedido.clienteNome}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{pedido.id.slice(-6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`https://wa.me/${pedido.clienteTelefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
                        >
                          {pedido.clienteTelefone}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isAguardando && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                          Aguardando PIX
                        </span>
                      )}
                      {isPreparando && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <Store className="w-3 h-3 text-blue-500" />
                          Preparando Pacote
                        </span>
                      )}
                      {isSaiuEntrega && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                          <Bike className="w-3 h-3 text-purple-500 animate-bounce" />
                          Saiu p/ Entrega
                        </span>
                      )}
                      {isEntregue && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Entregue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações da Entrega */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        {pedido.tipoEntrega === 'motoboy' && <Bike className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                        {pedido.tipoEntrega === 'correios' && <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                        {pedido.tipoEntrega === 'retirada' && <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        
                        {pedido.tipoEntrega === 'motoboy' ? '🛵 Motoboy Express (Mesmo Dia)' :
                         pedido.tipoEntrega === 'correios' ? '📦 Envio Correios (Sedex/PAC)' :
                         '🏪 Retirada Presencial no Studio'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {pedido.valorFrete === 0 ? 'Frete Grátis' : `Frete: R$ ${pedido.valorFrete.toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>

                    {pedido.tipoEntrega !== 'retirada' && (pedido.endereco || pedido.bairro || pedido.cep) && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1 pt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {pedido.endereco ? `${pedido.endereco}, ` : ''}
                          {pedido.bairro ? `${pedido.bairro} - ` : ''}
                          {pedido.cidade || ''} {pedido.cep ? `(CEP: ${pedido.cep})` : ''}
                        </span>
                      </div>
                    )}

                    {pedido.rastreio && (
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono pt-1">
                        Rastreio: <b>{pedido.rastreio}</b>
                      </div>
                    )}
                  </div>

                  {/* Itens do Pedido */}
                  <div className="space-y-1 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Itens Comprados:</span>
                    {pedido.itens?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span>
                          <b>{item.quantidade}x</b> {item.nome}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          R$ {(item.precoUnitario * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totalizador */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white mb-3">
                    <span>Total com Frete:</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Ações e Botões de Fluxo */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                  {isAguardando && (
                    <>
                      <button
                        onClick={() => onConfirmarPix(pedido.id)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirmar PIX Pago
                      </button>

                      <button
                        onClick={() => copiarPix(pedido.pixCodigo, pedido.id)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Copiar PIX Copia e Cola"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{copiadoId === pedido.id ? 'Copiado!' : 'PIX'}</span>
                      </button>

                      <button
                        onClick={() => handleGerarLinkMercadoPago(pedido)}
                        className="py-1.5 px-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        title="Gerar Link de Cartão 12x via Mercado Pago"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cartão 12x</span>
                      </button>
                    </>
                  )}

                  {isPreparando && (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => {
                          const rastreioPrompt = pedido.tipoEntrega === 'correios' ? prompt('Digite o código de rastreio dos Correios (ou deixe vazio):') : undefined;
                          onAtualizarStatus(pedido.id, 'saiu_entrega', rastreioPrompt || undefined);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-500/20"
                      >
                        {pedido.tipoEntrega === 'motoboy' ? <Bike className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                        {pedido.tipoEntrega === 'retirada' ? 'Disponível p/ Retirada' : 'Despachar / Saiu p/ Entrega'}
                      </button>
                    </div>
                  )}

                  {isSaiuEntrega && (
                    <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                      <button
                        onClick={() => dispararMensagemEnvioWhatsApp(pedido)}
                        className="w-full sm:flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Avisar no WhatsApp
                      </button>

                      <button
                        onClick={() => onAtualizarStatus(pedido.id, 'entregue')}
                        className="w-full sm:flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Marcar Entregue
                      </button>
                    </div>
                  )}

                  {isEntregue && (
                    <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Pedido Concluído
                      </span>
                      <span className="text-[10px]">
                        {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CALCULADORA RÁPIDA DE FRETE (CEP / CORREIOS / MOTOBOY) */}
      {modalFreteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Simulador de Frete</h3>
                  <p className="text-xs text-slate-400">Consulta automática ViaCEP e Correios</p>
                </div>
              </div>
              <button
                onClick={() => setModalFreteAberto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCalcularFrete} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CEP de Destino da Cliente:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 01304-001"
                    value={cepDestino}
                    onChange={(e) => setCepDestino(e.target.value)}
                    maxLength={9}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={calculandoFrete}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {calculandoFrete ? 'Calculando...' : 'Calcular'}
                  </button>
                </div>
                {erroFrete && (
                  <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {erroFrete}
                  </p>
                )}
              </div>
            </form>

            {/* Resultado do Frete */}
            {resultadoFrete && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Endereço Identificado:
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    {resultadoFrete.endereco.logradouro ? `${resultadoFrete.endereco.logradouro}, ` : ''}
                    {resultadoFrete.endereco.bairro ? `${resultadoFrete.endereco.bairro} - ` : ''}
                    {resultadoFrete.endereco.localidade}/{resultadoFrete.endereco.uf}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Opções Disponíveis:</span>
                  {resultadoFrete.opcoes.map((op: any) => (
                    <div
                      key={op.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {op.id === 'retirada' && <Store className="w-4 h-4 text-emerald-500" />}
                        {op.id === 'motoboy' && <Bike className="w-4 h-4 text-purple-500" />}
                        {op.id === 'sedex' && <Truck className="w-4 h-4 text-blue-500" />}
                        {op.id === 'pac' && <Truck className="w-4 h-4 text-amber-500" />}
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{op.titulo}</p>
                          <p className="text-[10px] text-slate-400">{op.prazo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black ${op.valor === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {op.valor === 0 ? 'GRÁTIS' : `R$ ${op.valor.toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={copiarTextoCotacaoWhatsApp}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{cotacaoCopiada ? 'Copiado para colar no WhatsApp!' : 'Copiar Cotação p/ o WhatsApp'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURAÇÕES DE FRETE E REGRAS */}
      {modalConfigAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <Settings className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Regras de Frete & Entrega</h3>
                  <p className="text-xs text-slate-400">Configure as taxas que a Manu (IA) usará</p>
                </div>
              </div>
              <button
                onClick={() => setModalConfigAberto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarConfiguracoes} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Taxa Fixa do Motoboy Express (R$):
                </label>
                <input
                  type="number"
                  step="0.50"
                  value={editConfigFrete.taxaMotoboy}
                  onChange={(e) => setEditConfigFrete({ ...editConfigFrete, taxaMotoboy: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Valor cobrado para entregas no mesmo dia na sua cidade.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CEP de Origem (Studio):
                  </label>
                  <input
                    type="text"
                    value={editConfigFrete.cepOrigem}
                    onChange={(e) => setEditConfigFrete({ ...editConfigFrete, cepOrigem: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade / UF:
                  </label>
                  <input
                    type="text"
                    value={`${editConfigFrete.cidadeOrigem} - ${editConfigFrete.estadoOrigem}`}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      setEditConfigFrete({
                        ...editConfigFrete,
                        cidadeOrigem: parts[0]?.trim() || editConfigFrete.cidadeOrigem,
                        estadoOrigem: parts[1]?.trim() || editConfigFrete.estadoOrigem
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Frete Grátis em Compras Acima de (R$):
                </label>
                <input
                  type="number"
                  step="5"
                  value={editConfigFrete.freteGratisAcimaDe}
                  onChange={(e) => setEditConfigFrete({ ...editConfigFrete, freteGratisAcimaDe: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Canais Habilitados:</span>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editConfigFrete.permiteMotoboy}
                    onChange={(e) => setEditConfigFrete({ ...editConfigFrete, permiteMotoboy: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Habilitar Motoboy Express (Mesmo Dia)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editConfigFrete.permiteCorreios}
                    onChange={(e) => setEditConfigFrete({ ...editConfigFrete, permiteCorreios: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Habilitar Correios (Sedex & PAC para outras cidades)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editConfigFrete.permiteRetirada}
                    onChange={(e) => setEditConfigFrete({ ...editConfigFrete, permiteRetirada: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Habilitar Retirada Grátis no Studio
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalConfigAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-600/30"
                >
                  Salvar Regras de Frete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NOVO PEDIDO MANUAL (VENDA BALCÃO / WHATSAPP) */}
      {modalNovoPedidoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Criar Novo Pedido de Venda</h3>
                  <p className="text-xs text-slate-400">Venda de produtos Home-Care com entrega ou retirada</p>
                </div>
              </div>
              <button
                onClick={() => setModalNovoPedidoAberto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoPedido} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Cliente: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Silva"
                    value={novoClienteNome}
                    onChange={(e) => setNovoClienteNome(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="11987654321"
                    value={novoClienteTelefone}
                    onChange={(e) => setNovoClienteTelefone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Seção de Adicionar Itens */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Escolher Produtos do Estoque:
                </span>
                <div className="flex gap-2">
                  <select
                    value={novoItemSelecionado}
                    onChange={(e) => setNovoItemSelecionado(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtosVenda.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (Estoque: {p.quantidade}) - R$ {(p.precoVenda || 0).toFixed(2).replace('.', ',')}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-center text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarItemCarrinho}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Lista de itens no carrinho */}
                {carrinhoItens.length > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {carrinhoItens.map((item) => (
                      <div key={item.produtoId} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span><b>{item.quantidade}x</b> {item.nome}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            R$ {(item.precoUnitario * item.quantidade).toFixed(2).replace('.', ',')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverItemCarrinho(item.produtoId)}
                            className="text-rose-500 hover:text-rose-700 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Nenhum produto adicionado ao pedido ainda.</p>
                )}
              </div>

              {/* Tipo de Entrega e Frete */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Forma de Entrega:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipoEntrega('motoboy');
                      setNovoValorFrete(freteConfig.taxaMotoboy);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      novoTipoEntrega === 'motoboy'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Motoboy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipoEntrega('correios');
                      setNovoValorFrete(18.50);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      novoTipoEntrega === 'correios'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Correios</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipoEntrega('retirada');
                      setNovoValorFrete(0);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      novoTipoEntrega === 'retirada'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Retirada</span>
                  </button>
                </div>

                {novoTipoEntrega !== 'retirada' && (
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          CEP de Entrega:
                        </label>
                        <input
                          type="text"
                          placeholder="01304-001"
                          value={novoCep}
                          onChange={(e) => setNovoCep(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Valor do Frete (R$):
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          value={novoValorFrete}
                          onChange={(e) => setNovoValorFrete(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Endereço & Bairro:
                      </label>
                      <input
                        type="text"
                        placeholder="Rua Augusta, 1500, Ap 42 - Consolação"
                        value={novoEndereco}
                        onChange={(e) => setNovoEndereco(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status de Pagamento */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkPago"
                  checked={pedidoJaPago}
                  onChange={(e) => setPedidoJaPago(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="chkPago" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Já foi pago via PIX/Cartão (Lançar receita no Caixa imediatamente)
                </label>
              </div>

              {/* Resumo Final */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Valor Total do Pedido:</span>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    R$ {totalGeralPedido.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <p>Itens: R$ {totalItensCarrinho.toFixed(2).replace('.', ',')}</p>
                  <p>Frete: R$ {(novoTipoEntrega === 'retirada' ? 0 : novoValorFrete).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              {/* Botões */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoPedidoAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carrinhoItens.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  Criar Pedido e Gerar PIX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: LINK DE PAGAMENTO MERCADO PAGO (CARTÃO 12X) */}
      {modalMpAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Link Mercado Pago</h3>
                  <p className="text-xs text-slate-400">Parcelamento em até 12x ou PIX Seguro</p>
                </div>
              </div>
              <button
                onClick={() => setModalMpAberto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {gerandoLinkMp ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Gerando Checkout Pro no Mercado Pago...
                </p>
              </div>
            ) : linkMpGerado ? (
              <div className="space-y-3.5">
                {/* Resumo do Pedido */}
                {pedidoSelecionadoMp && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
                      <span>Cliente: {pedidoSelecionadoMp.clienteNome}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        R$ {pedidoSelecionadoMp.valorTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {pedidoSelecionadoMp.itens.length} {pedidoSelecionadoMp.itens.length === 1 ? 'produto' : 'produtos'} • {pedidoSelecionadoMp.tipoEntrega === 'motoboy' ? 'Motoboy' : pedidoSelecionadoMp.tipoEntrega === 'correios' ? 'Correios' : 'Retirada'}
                    </p>
                  </div>
                )}

                {/* Input do Link */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Link de Checkout Gerado:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={linkMpGerado}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white select-all"
                    />
                    <button
                      onClick={() => copiarLinkMp(linkMpGerado)}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      {linkMpCopiado ? (
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

                {/* Botões de Ação */}
                <div className="space-y-2 pt-1">
                  {pedidoSelecionadoMp && (
                    <a
                      href={`https://wa.me/${pedidoSelecionadoMp.clienteTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${pedidoSelecionadoMp.clienteNome}! ✨\n\nSegue o link seguro para você pagar seu pedido no Studio com *Cartão de Crédito em até 12x* ou PIX:\n👉 ${linkMpGerado}\n\nAssim que aprovado, já separamos seus produtos com todo carinho! 🌸`
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
                    href={linkMpGerado}
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
