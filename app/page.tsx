'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNav, TabType } from '@/components/BottomNav';
import { AgendaTab } from '@/components/AgendaTab';
import { ClientesTab } from '@/components/ClientesTab';
import { CaixaTab } from '@/components/CaixaTab';
import { ServicosTab } from '@/components/ServicosTab';
import { EstoqueTab } from '@/components/EstoqueTab';
import { RecepcionistaTab } from '@/components/RecepcionistaTab';
import { PedidosTab } from '@/components/PedidosTab';
import { ModalNovoAgendamento } from '@/components/ModalNovoAgendamento';
import { LoginScreen } from '@/components/LoginScreen';
import { Agendamento, Servico, TransacaoCaixa, ItemEstoque, Cliente, Configuracoes, Pedido } from '@/lib/store';
import { RefreshCw } from 'lucide-react';

interface UsuarioSessao {
  nome: string;
  email: string;
  cargo: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Sistema de Autenticação / Login
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);

  // Sistema de Tema Claro e Escuro
  const [temaEscuro, setTemaEscuro] = useState(false);

  // Estados dos dados
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [caixa, setCaixa] = useState<TransacaoCaixa[]>([]);
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    nomeEmpresa: "Studio Bruna Meireles",
    telefoneWhatsApp: "5511987654321",
    statusWhatsApp: "conectado",
    chavePix: "11987654321",
    tipoChavePix: "telefone",
    sinalPadrao: 30,
    horarioAbertura: "09:00",
    horarioFechamento: "19:00",
    iaAtiva: true,
    promptRecepcionista: "",
    endereco: {
      logradouro: "Rua Augusta",
      numero: "1500",
      complemento: "Sala 32",
      bairro: "Consolação",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01304-001",
      pontoReferencia: "Próximo à estação Consolação do Metrô",
      linkMaps: "https://maps.google.com/?q=Rua+Augusta,+1500+-+Consola%C3%A7%C3%A3o,+S%C3%A3o+Paulo+-+SP"
    },
    frete: {
      taxaMotoboy: 15.00,
      cepOrigem: "01304-001",
      cidadeOrigem: "São Paulo",
      estadoOrigem: "SP",
      freteGratisAcimaDe: 150.00,
      permiteRetirada: true,
      permiteMotoboy: true,
      permiteCorreios: true
    }
  });

  // Inicialização de Tema e Sessão
  useEffect(() => {
    const temaSalvo = localStorage.getItem('studio_tema');
    if (temaSalvo === 'dark' || (!temaSalvo && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTemaEscuro(true);
      document.documentElement.classList.add('dark');
    } else {
      setTemaEscuro(false);
      document.documentElement.classList.remove('dark');
    }

    const sessaoSalva = localStorage.getItem('studio_usuario');
    if (sessaoSalva) {
      try {
        setUsuario(JSON.parse(sessaoSalva));
      } catch (e) {
        console.error(e);
      }
    }

    carregarDados();
  }, []);

  const handleToggleTema = () => {
    const novoTema = !temaEscuro;
    setTemaEscuro(novoTema);
    if (novoTema) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('studio_tema', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('studio_tema', 'light');
    }
  };

  const handleLogin = (dadosUsuario: UsuarioSessao) => {
    setUsuario(dadosUsuario);
    localStorage.setItem('studio_usuario', JSON.stringify(dadosUsuario));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('studio_usuario');
  };

  const carregarDados = async () => {
    try {
      const [resAg, resSrv, resCx, resEst, resWpp, resCli, resPed] = await Promise.all([
        fetch('/api/agendamentos'),
        fetch('/api/servicos'),
        fetch('/api/caixa'),
        fetch('/api/estoque'),
        fetch('/api/whatsapp'),
        fetch('/api/clientes'),
        fetch('/api/pedidos')
      ]);

      const [dataAg, dataSrv, dataCx, dataEst, dataWpp, dataCli, dataPed] = await Promise.all([
        resAg.json(),
        resSrv.json(),
        resCx.json(),
        resEst.json(),
        resWpp.json(),
        resCli.json(),
        resPed.json()
      ]);

      if (Array.isArray(dataAg)) setAgendamentos(dataAg);
      if (Array.isArray(dataSrv)) setServicos(dataSrv);
      if (dataCx?.transacoes) setCaixa(dataCx.transacoes);
      if (Array.isArray(dataEst)) setEstoque(dataEst);
      if (Array.isArray(dataCli)) setClientes(dataCli);
      if (Array.isArray(dataPed)) setPedidos(dataPed);
      if (dataWpp) {
        setConfiguracoes(prev => ({
          ...prev,
          nomeEmpresa: dataWpp.nomeEmpresa || prev.nomeEmpresa,
          telefoneWhatsApp: dataWpp.telefone || prev.telefoneWhatsApp,
          statusWhatsApp: dataWpp.status || prev.statusWhatsApp,
          qrCodeAtual: dataWpp.qrCodeAtual ?? prev.qrCodeAtual,
          chavePix: dataWpp.chavePix || prev.chavePix,
          sinalPadrao: dataWpp.sinalPadrao || prev.sinalPadrao,
          iaAtiva: dataWpp.iaAtiva ?? prev.iaAtiva,
          promptRecepcionista: dataWpp.prompt || prev.promptRecepcionista,
          endereco: dataWpp.endereco || prev.endereco,
          frete: dataWpp.frete || prev.frete,
          geminiApiKey: dataWpp.geminiApiKey ?? prev.geminiApiKey,
          modeloGemini: dataWpp.modeloGemini ?? prev.modeloGemini,
          groqApiKey: dataWpp.groqApiKey ?? prev.groqApiKey,
          modeloGroq: dataWpp.modeloGroq ?? prev.modeloGroq,
          mercadoPagoAtivo: dataWpp.mercadoPagoAtivo ?? prev.mercadoPagoAtivo,
          mercadoPagoAccessToken: dataWpp.mercadoPagoAccessToken ?? prev.mercadoPagoAccessToken,
          mercadoPagoPublicKey: dataWpp.mercadoPagoPublicKey ?? prev.mercadoPagoPublicKey
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error);
    } finally {
      setCarregando(false);
    }
  };

  // Handlers de Ações
  const handleConfirmarSinal = async (id: string) => {
    try {
      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirmar_sinal' })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleConcluirAtendimento = async (id: string, formaPagamento: string) => {
    try {
      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'concluir_atendimento',
          formaPagamentoRestante: formaPagamento 
        })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancelar' })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNovoAgendamento = async (dados: any) => {
    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNovaTransacao = async (dados: any) => {
    try {
      const res = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNovoServico = async (dados: any) => {
    try {
      const res = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditarServico = async (dados: any) => {
    try {
      const res = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'editar', ...dados })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExcluirServico = async (id: string) => {
    try {
      const res = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'excluir', id })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAjustarQuantidade = async (id: string, delta: number) => {
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ajustar_quantidade', id, delta })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNovoItemEstoque = async (dados: any) => {
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditarItemEstoque = async (dados: any) => {
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'editar', ...dados })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExcluirItemEstoque = async (id: string) => {
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'excluir', id })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNovoCliente = async (dados: any) => {
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditarCliente = async (dados: any) => {
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleIa = async () => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_ia' })
      });
      const data = await res.json();
      setConfiguracoes(prev => ({ ...prev, iaAtiva: data.iaAtiva }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSalvarConfig = async (config: Partial<Configuracoes>) => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', ...config })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmarPixPedido = async (id: string) => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirmar_pix' })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error("Erro ao confirmar PIX do pedido:", error);
    }
  };

  const handleAtualizarStatusPedido = async (id: string, status: Pedido['status'], rastreio?: string) => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rastreio })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
    }
  };

  const handleNovoPedido = async (dados: any) => {
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error("Erro ao criar pedido manual:", error);
    }
  };

  const handleSalvarFreteConfig = async (frete: any) => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', frete })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error("Erro ao salvar regras de frete:", error);
    }
  };

  const qtdAguardandoSinal = agendamentos.filter(a => a.status === 'aguardando_sinal').length;
  const qtdEstoqueAlerta = estoque.filter(e => e.quantidade <= e.minimoAlerta).length;
  const qtdPedidosAlerta = pedidos.filter(p => p.status === 'aguardando_pix' || p.status === 'preparando').length;

  // Clientes com mais de 20 dias da última visita
  const qtdManutencaoAlerta = clientes.filter(c => {
    try {
      const diff = Math.abs(new Date().getTime() - new Date(c.ultimaVisita + 'T00:00:00').getTime());
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) >= 20;
    } catch {
      return false;
    }
  }).length;

  if (!usuario) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        nomeEmpresa={configuracoes.nomeEmpresa}
      />
    );
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none animate-bounce mb-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-bold text-slate-800 dark:text-white text-sm">Carregando Studio & Gestão Pro...</p>
        <p className="text-xs text-slate-400 mt-1">Deixando tudo perfeitinho para você ✨</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        nomeEmpresa={configuracoes.nomeEmpresa}
        statusWhatsApp={configuracoes.statusWhatsApp}
        temaEscuro={temaEscuro}
        onToggleTema={handleToggleTema}
        usuario={usuario}
        onLogout={handleLogout}
        onOpenNovoAgendamento={() => setModalNovoAberto(true)}
      />

      {/* Conteúdo Principal com as 7 Abas */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 pb-28 sm:pb-32">
        {activeTab === 'agenda' && (
          <AgendaTab
            agendamentos={agendamentos}
            onConfirmarSinal={handleConfirmarSinal}
            onConcluirAtendimento={handleConcluirAtendimento}
            onCancelar={handleCancelar}
            onNovoAgendamento={() => setModalNovoAberto(true)}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientesTab
            clientes={clientes}
            onNovoCliente={handleNovoCliente}
            onEditarCliente={handleEditarCliente}
            onRecarregarClientes={carregarDados}
          />
        )}

        {activeTab === 'pedidos' && (
          <PedidosTab
            pedidos={pedidos}
            estoque={estoque}
            freteConfig={configuracoes.frete}
            onConfirmarPix={handleConfirmarPixPedido}
            onAtualizarStatus={handleAtualizarStatusPedido}
            onNovoPedido={handleNovoPedido}
            onSalvarFreteConfig={handleSalvarFreteConfig}
          />
        )}

        {activeTab === 'caixa' && (
          <CaixaTab
            transacoes={caixa}
            onNovaTransacao={handleNovaTransacao}
          />
        )}

        {activeTab === 'servicos' && (
          <ServicosTab
            servicos={servicos}
            onNovoServico={handleNovoServico}
            onEditarServico={handleEditarServico}
            onExcluirServico={handleExcluirServico}
          />
        )}

        {activeTab === 'estoque' && (
          <EstoqueTab
            estoque={estoque}
            onAjustarQuantidade={handleAjustarQuantidade}
            onNovoItem={handleNovoItemEstoque}
            onEditarItem={handleEditarItemEstoque}
            onExcluirItem={handleExcluirItemEstoque}
          />
        )}

        {activeTab === 'recepcionista' && (
          <RecepcionistaTab
            configuracoes={configuracoes}
            onToggleIa={handleToggleIa}
            onSalvarConfig={handleSalvarConfig}
            onMensagemSimuladaEnviada={carregarDados}
          />
        )}
      </main>

      {/* Modal Rápido de Novo Agendamento */}
      <ModalNovoAgendamento
        aberto={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        servicos={servicos}
        onSalvar={handleNovoAgendamento}
      />

      {/* Barra de Navegação Inferior de 7 Módulos */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        qtdAguardandoSinal={qtdAguardandoSinal}
        qtdEstoqueAlerta={qtdEstoqueAlerta}
        qtdManutencaoAlerta={qtdManutencaoAlerta}
        qtdPedidosAlerta={qtdPedidosAlerta}
      />
    </div>
  );
}
