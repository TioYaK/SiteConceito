'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Power, 
  QrCode, 
  MessageSquare, 
  ShieldCheck, 
  Check, 
  RefreshCw,
  X,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Zap,
  CreditCard,
  Lock
} from 'lucide-react';
import { Configuracoes } from '@/lib/store';

interface RecepcionistaTabProps {
  configuracoes: Configuracoes;
  onToggleIa: () => void;
  onSalvarConfig: (config: Partial<Configuracoes>) => void;
  onMensagemSimuladaEnviada?: () => void;
}

interface MensagemChat {
  id: string;
  autor: 'cliente' | 'recepcionista';
  texto: string;
  horario: string;
}

export function RecepcionistaTab({
  configuracoes,
  onToggleIa,
  onSalvarConfig,
  onMensagemSimuladaEnviada
}: RecepcionistaTabProps) {
  const [chavePixInput, setChavePixInput] = useState(configuracoes.chavePix);
  const [sinalPadraoInput, setSinalPadraoInput] = useState(String(configuracoes.sinalPadrao));
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [configSalvaComSucesso, setConfigSalvaComSucesso] = useState(false);
  const [modalQrAberto, setModalQrAberto] = useState(false);

  // Estados do Google Gemini Pro
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(configuracoes.geminiApiKey || '');
  const [modeloGeminiInput, setModeloGeminiInput] = useState(configuracoes.modeloGemini || 'gemini-1.5-flash');
  const [mostrarKey, setMostrarKey] = useState(false);
  const [testandoGemini, setTestandoGemini] = useState(false);
  const [resultadoTesteGemini, setResultadoTesteGemini] = useState<{ sucesso: boolean; mensagem?: string; erro?: string } | null>(null);
  const [motorAtivoNoChat, setMotorAtivoNoChat] = useState<string>(configuracoes.geminiApiKey ? 'google_gemini' : 'local');

  // Estados do Mercado Pago
  const [mpAtivoInput, setMpAtivoInput] = useState(configuracoes.mercadoPagoAtivo ?? false);
  const [mpAccessTokenInput, setMpAccessTokenInput] = useState(configuracoes.mercadoPagoAccessToken || '');
  const [mpPublicKeyInput, setMpPublicKeyInput] = useState(configuracoes.mercadoPagoPublicKey || '');
  const [mostrarMpToken, setMostrarMpToken] = useState(false);
  const [testandoMp, setTestandoMp] = useState(false);
  const [resultadoTesteMp, setResultadoTesteMp] = useState<{ sucesso: boolean; mensagem?: string; erro?: string } | null>(null);
  const [salvandoMp, setSalvandoMp] = useState(false);

  // Chat Simulador
  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: 'msg-1',
      autor: 'recepcionista',
      texto: `Olá! Sou a Manu, recepcionista virtual do Studio ✨. Como posso te ajudar hoje? Posso te passar os valores de extensão de cílios, design de sobrancelhas, brow lamination, micropigmentação ou limpeza de pele!`,
      horario: '10:00'
    }
  ]);
  const [textoInput, setTextoInput] = useState('');
  const [carregandoResposta, setCarregandoResposta] = useState(false);

  const handleTestarGemini = async () => {
    if (!geminiApiKeyInput.trim()) {
      setResultadoTesteGemini({ sucesso: false, erro: 'Digite ou cole sua chave de API do Google Gemini antes de testar.' });
      return;
    }
    setTestandoGemini(true);
    setResultadoTesteGemini(null);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'testar_gemini',
          geminiApiKey: geminiApiKeyInput.trim(),
          modeloGemini: modeloGeminiInput
        })
      });
      const data = await res.json();
      if (res.ok && data.sucesso) {
        setResultadoTesteGemini({ sucesso: true, mensagem: data.mensagem });
        setMotorAtivoNoChat('google_gemini');
        onSalvarConfig({
          geminiApiKey: geminiApiKeyInput.trim(),
          modeloGemini: modeloGeminiInput
        });
      } else {
        setResultadoTesteGemini({ sucesso: false, erro: data.erro || 'Não foi possível validar a chave com o Google.' });
      }
    } catch {
      setResultadoTesteGemini({ sucesso: false, erro: 'Erro de conexão com o servidor local.' });
    } finally {
      setTestandoGemini(false);
    }
  };

  const handleSalvarGemini = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarConfig({
      geminiApiKey: geminiApiKeyInput.trim(),
      modeloGemini: modeloGeminiInput
    });
    setMotorAtivoNoChat(geminiApiKeyInput.trim() ? 'google_gemini' : 'local');
    setResultadoTesteGemini({ sucesso: true, mensagem: 'Configuração do Google Gemini salva com sucesso!' });
    setTimeout(() => setResultadoTesteGemini(null), 3500);
  };

  const handleTestarMp = async () => {
    if (!mpAccessTokenInput.trim()) {
      setResultadoTesteMp({ sucesso: false, erro: 'Informe o Access Token do Mercado Pago antes de testar.' });
      return;
    }
    setTestandoMp(true);
    setResultadoTesteMp(null);
    try {
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'testar_credenciais',
          accessToken: mpAccessTokenInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.sucesso) {
        setResultadoTesteMp({ sucesso: true, mensagem: data.mensagem });
      } else {
        setResultadoTesteMp({ sucesso: false, erro: data.erro || 'Token inválido ou não autorizado pelo Mercado Pago.' });
      }
    } catch {
      setResultadoTesteMp({ sucesso: false, erro: 'Falha de conexão com os servidores do Mercado Pago.' });
    } finally {
      setTestandoMp(false);
    }
  };

  const handleSalvarMp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoMp(true);
    setResultadoTesteMp(null);
    try {
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'salvar_credenciais',
          mercadoPagoAtivo: mpAtivoInput,
          mercadoPagoAccessToken: mpAccessTokenInput.trim(),
          mercadoPagoPublicKey: mpPublicKeyInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.sucesso) {
        onSalvarConfig({
          mercadoPagoAtivo: mpAtivoInput,
          mercadoPagoAccessToken: mpAccessTokenInput.trim(),
          mercadoPagoPublicKey: mpPublicKeyInput.trim()
        });
        setResultadoTesteMp({ sucesso: true, mensagem: 'Credenciais do Mercado Pago salvas com sucesso!' });
        setTimeout(() => setResultadoTesteMp(null), 3500);
      } else {
        setResultadoTesteMp({ sucesso: false, erro: data.erro || 'Erro ao salvar credenciais.' });
      }
    } catch {
      setResultadoTesteMp({ sucesso: false, erro: 'Erro ao salvar configurações do Mercado Pago.' });
    } finally {
      setSalvandoMp(false);
    }
  };

  const handleEnviarMensagem = async (textoParaEnviar?: string) => {
    const texto = (textoParaEnviar || textoInput).trim();
    if (!texto || carregandoResposta) return;

    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const novaMsgCliente: MensagemChat = {
      id: `msg-${Date.now()}`,
      autor: 'cliente',
      texto,
      horario: agora
    };

    setMensagens(prev => [...prev, novaMsgCliente]);
    setTextoInput('');
    setCarregandoResposta(true);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simular_mensagem',
          mensagem: texto,
          clienteNome: 'Mariana (Teste)',
          clienteTelefone: '5511999998888'
        })
      });

      const data = await res.json();
      if (data.sucesso && data.respostaBot) {
        setMensagens(prev => [
          ...prev,
          {
            id: `msg-bot-${Date.now()}`,
            autor: 'recepcionista',
            texto: data.respostaBot,
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        if (onMensagemSimuladaEnviada) {
          onMensagemSimuladaEnviada();
        }
      }
    } catch (error) {
      console.error("Erro no simulador:", error);
    } finally {
      setCarregandoResposta(false);
    }
  };

  const handleSalvarPix = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    onSalvarConfig({
      chavePix: chavePixInput,
      sinalPadrao: parseFloat(sinalPadraoInput.replace(',', '.')) || 30
    });
    setTimeout(() => {
      setSalvandoConfig(false);
      setConfigSalvaComSucesso(true);
      setTimeout(() => setConfigSalvaComSucesso(false), 2500);
    }, 500);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Card do Status do Bot */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              configuracoes.iaAtiva 
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shadow-sm' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <Bot className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  Recepcionista do WhatsApp
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  configuracoes.iaAtiva 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {configuracoes.iaAtiva ? '🟢 ATENDIMENTO ATIVO' : '⏸️ PAUSADA'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Responde clientes 24h, tira dúvidas dos 5 serviços e cobra sinal PIX.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalQrAberto(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Conectar Chip</span>
            </button>

            <button
              onClick={onToggleIa}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm ${
                configuracoes.iaAtiva
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{configuracoes.iaAtiva ? 'Pausar Atendente' : 'Ligar Atendente'}</span>
            </button>
          </div>
        </div>

        {/* Configurações da Chave PIX */}
        <form onSubmit={handleSalvarPix} className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Chave PIX que a cliente vai receber para pagar o sinal:
            </label>
            <input
              type="text"
              required
              placeholder="Ex: seu telefone, CPF ou e-mail"
              value={chavePixInput}
              onChange={(e) => setChavePixInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={salvandoConfig}
              className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5"
            >
              {configSalvaComSucesso ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Salvo!</span>
                </>
              ) : (
                <span>Salvar Chave PIX</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* CARD GOOGLE GEMINI PRO AI ENGINE */}
      <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-blue-900/10 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-blue-950/30 rounded-3xl p-5 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  Google Gemini Pro AI
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  configuracoes.geminiApiKey 
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                }`}>
                  {configuracoes.geminiApiKey ? '✨ Gemini Ativo' : '⚡ Motor Local Ativo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Conecte seu plano Google AI Pro para a Manu responder com inteligência humana, raciocínio avançado e simpatia.
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span>Gerar Chave no Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Formulário de Configuração do Gemini */}
        <form onSubmit={handleSalvarGemini} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Input da Chave */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Chave da API do Google Gemini (API Key):
              </label>
              <div className="relative">
                <input
                  type={mostrarKey ? "text" : "password"}
                  placeholder="AIzaSy... (cole sua chave do Google AI aqui)"
                  value={geminiApiKeyInput}
                  onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarKey(!mostrarKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  {mostrarKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Seleção do Modelo */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Modelo do Gemini:
              </label>
              <select
                value={modeloGeminiInput}
                onChange={(e) => setModeloGeminiInput(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Recomendado - Ultra Rápido ✨)</option>
                <option value="gemini-flash-lite-latest">Gemini Flash Lite (Mais recente 🚀)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Estável & Preciso 🧠)</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400 italic">
              Se você não colocar uma chave agora, o sistema continua funcionando com o motor inteligente de regras!
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestarGemini}
                disabled={testandoGemini}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testandoGemini ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testando com o Google...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Testar Conexão</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Chave</span>
              </button>
            </div>
          </div>

          {/* Resultado do Teste */}
          {resultadoTesteGemini && (
            <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in ${
              resultadoTesteGemini.sucesso
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}>
              {resultadoTesteGemini.sucesso ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">
                  {resultadoTesteGemini.sucesso ? 'Google Gemini Conectado com Sucesso!' : 'Falha na Conexão:'}
                </p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  {resultadoTesteGemini.mensagem || resultadoTesteGemini.erro}
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* CARD MERCADO PAGO • CHECKOUT PRO & CARTÃO 12X */}
      <div className="bg-gradient-to-br from-sky-900/10 via-cyan-900/5 to-blue-900/10 dark:from-sky-950/40 dark:via-cyan-950/20 dark:to-blue-950/30 rounded-3xl p-5 border border-sky-200/60 dark:border-sky-800/60 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 flex-shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  Mercado Pago • Cartão em até 12x & PIX
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  mpAtivoInput && configuracoes.mercadoPagoAccessToken
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}>
                  {mpAtivoInput && configuracoes.mercadoPagoAccessToken ? '💳 Ativo (Cartão 12x Liberado)' : '⏸️ Aguardando Configuração'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Venda produtos e cobre procedimentos parcelados em até 12x no cartão com taxas reduzidas e link oficial gerado pela Manu (IA).
              </p>
            </div>
          </div>

          <a
            href="https://www.mercadopago.com.br/developers/panel/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span>Obter Token no Mercado Pago</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Badges de recursos */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-sky-100/70 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 font-semibold border border-sky-200/50 dark:border-sky-800">
            💳 Cartão de Crédito até 12x
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-800">
            ⚡ PIX com Baixa Automática
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-indigo-800">
            🔒 Checkout Pro Seguro
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/50 dark:border-amber-800">
            🤖 Manu envia link no WhatsApp
          </span>
        </div>

        {/* Formulário de Configuração do Mercado Pago */}
        <form onSubmit={handleSalvarMp} className="space-y-3 pt-1">
          {/* Toggle Ativo */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-sky-100 dark:border-sky-900/50">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Habilitar Cobrança com Mercado Pago
              </span>
              <span className="text-[11px] text-slate-400">
                Quando ativo, a recepcionista oferecerá a opção de parcelar em 12x no cartão além do PIX direto.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMpAtivoInput(!mpAtivoInput)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                mpAtivoInput ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  mpAtivoInput ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Input Access Token */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Access Token de Produção (ou Teste):
              </label>
              <div className="relative">
                <input
                  type={mostrarMpToken ? "text" : "password"}
                  placeholder="APP_USR-xxxxxx... ou TEST-xxxxxx..."
                  value={mpAccessTokenInput}
                  onChange={(e) => setMpAccessTokenInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarMpToken(!mostrarMpToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  {mostrarMpToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input Public Key */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Public Key (Chave Pública - Opcional):
              </label>
              <input
                type="text"
                placeholder="APP_USR-xxxx ou TEST-xxxx"
                value={mpPublicKeyInput}
                onChange={(e) => setMpPublicKeyInput(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400 italic">
              Seu dinheiro cai na sua conta Mercado Pago imediatamente após aprovação!
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestarMp}
                disabled={testandoMp}
                className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testandoMp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testando no Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Testar Credenciais</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={salvandoMp}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-95 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {salvandoMp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Mercado Pago</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback do Teste / Salvamento */}
          {resultadoTesteMp && (
            <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in ${
              resultadoTesteMp.sucesso
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}>
              {resultadoTesteMp.sucesso ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">
                  {resultadoTesteMp.sucesso ? 'Mercado Pago Configurado com Sucesso!' : 'Atenção ao Configurar:'}
                </p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  {resultadoTesteMp.mensagem || resultadoTesteMp.erro}
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Simulador ao Vivo do WhatsApp */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {/* Barra Superior WhatsApp */}
        <div className="bg-[#075E54] dark:bg-emerald-950 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm leading-none">Manu • Recepcionista Virtual</h4>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-semibold text-emerald-100 flex items-center gap-1">
                  {motorAtivoNoChat.startsWith('google') ? '✨ Gemini Pro' : '⚡ Motor Inteligente'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-200 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online agora (atendendo WhatsApp)
              </span>
            </div>
          </div>

          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-semibold text-emerald-100">
            Simulador Interativo
          </span>
        </div>

        {/* Mensagens */}
        <div className="p-4 bg-[#E5DDD5] dark:bg-slate-950 min-h-[300px] max-h-[420px] overflow-y-auto space-y-3">
          {mensagens.map((msg) => {
            const isCliente = msg.autor === 'cliente';

            return (
              <div
                key={msg.id}
                className={`flex ${isCliente ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-sm text-xs leading-relaxed ${
                    isCliente
                      ? 'bg-[#DCF8C6] dark:bg-emerald-900 text-slate-900 dark:text-emerald-50 rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-transparent dark:border-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.texto}</p>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 text-right block mt-1 font-medium">
                    {msg.horario}
                  </span>
                </div>
              </div>
            );
          })}

          {carregandoResposta && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none p-3 shadow-sm text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-transparent dark:border-slate-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>Manu está digitando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sugestões Rápidas */}
        <div className="bg-slate-100 dark:bg-slate-950 p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs transition-colors scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap pl-1">
            Testar:
          </span>
          <button
            onClick={() => handleEnviarMensagem('quanto sai brow e micro e limpeza de pele')}
            className="whitespace-nowrap bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[11px] px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm"
          >
            "quanto sai brow e micro"
          </button>
          <button
            onClick={() => handleEnviarMensagem('Quero marcar a micro amanhã às 14h')}
            className="whitespace-nowrap bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[11px] px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm"
          >
            "Quero marcar a micro amanhã às 14h"
          </button>
          <button
            onClick={() => handleEnviarMensagem('Quanto é o frete pro CEP 01304-001?')}
            className="whitespace-nowrap bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[11px] px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm"
          >
            "🛵 Quanto é o frete pro CEP 01304-001?"
          </button>
          <button
            onClick={() => handleEnviarMensagem('Vocês vendem espuma de cílios?')}
            className="whitespace-nowrap bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[11px] px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm"
          >
            "🛍️ Vocês vendem espuma de cílios?"
          </button>
          <button
            onClick={() => handleEnviarMensagem('Quero comprar a espuma e receber por motoboy hoje')}
            className="whitespace-nowrap bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[11px] px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm"
          >
            "⚡ Quero a espuma por motoboy hoje"
          </button>
        </div>

        {/* Campo de Digitação */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEnviarMensagem();
          }}
          className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Digite como se fosse uma cliente..."
            value={textoInput}
            onChange={(e) => setTextoInput(e.target.value)}
            disabled={carregandoResposta}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!textoInput.trim() || carregandoResposta}
            className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer flex-shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Modal de Conexão WhatsApp / QR Code */}
      {modalQrAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Conectar Chip do WhatsApp</h3>
              <button
                onClick={() => setModalQrAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl inline-block border border-slate-200 dark:border-slate-700">
              {/* QR Code SVG Visual */}
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                <path d="M0,0 h30 v30 h-30 z M5,5 v20 h20 v-20 z M10,10 h10 v10 h-10 z" className="text-slate-800 dark:text-slate-100"/>
                <path d="M70,0 h30 v30 h-30 z M75,5 v20 h20 v-20 z M80,10 h10 v10 h-10 z" className="text-slate-800 dark:text-slate-100"/>
                <path d="M0,70 h30 v30 h-30 z M5,75 v20 h20 v-20 z M10,80 h10 v10 h-10 z" className="text-slate-800 dark:text-slate-100"/>
                <rect x="40" y="10" width="10" height="20" className="text-slate-800 dark:text-slate-100"/>
                <rect x="15" y="40" width="20" height="10" className="text-slate-800 dark:text-slate-100"/>
                <rect x="45" y="45" width="15" height="15" className="text-emerald-600 dark:text-emerald-400"/>
                <rect x="70" y="40" width="20" height="10" className="text-slate-800 dark:text-slate-100"/>
                <rect x="40" y="70" width="10" height="20" className="text-slate-800 dark:text-slate-100"/>
                <rect x="70" y="70" width="15" height="15" className="text-slate-800 dark:text-slate-100"/>
              </svg>
            </div>

            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-bold text-slate-700 dark:text-slate-300">Como conectar o número:</p>
              <p>1. Abra o WhatsApp no celular do Studio</p>
              <p>2. Toque em <strong>Aparelhos conectados &gt; Conectar aparelho</strong></p>
              <p>3. Aponte a câmera para a tela</p>
            </div>

            <button
              onClick={() => {
                alert("Chip simulado conectado com sucesso!");
                setModalQrAberto(false);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer shadow"
            >
              Confirmar Conexão ✅
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
