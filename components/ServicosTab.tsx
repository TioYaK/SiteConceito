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
  X,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Upload,
  Check,
  ExternalLink
} from 'lucide-react';
import { Servico } from '@/lib/store';

interface ServicosTabProps {
  servicos: Servico[];
  onNovoServico: (servico: Partial<Servico>) => void;
  onEditarServico?: (servico: Partial<Servico> & { id: string }) => void;
  onExcluirServico?: (id: string) => void;
}

// Sugestões de imagens profissionais de alta definição para beleza
const PRESETS_IMAGENS = [
  {
    titulo: 'Cílios Volume Russo',
    categoria: 'Cílios',
    url: 'https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80'
  },
  {
    titulo: 'Volume Brasileiro / Híbrido',
    categoria: 'Cílios',
    url: 'https://images.unsplash.com/photo-1512290900672-1f55b0a39034?w=800&auto=format&fit=crop&q=80'
  },
  {
    titulo: 'Design & Henna',
    categoria: 'Sobrancelhas',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'
  },
  {
    titulo: 'Brow Lamination',
    categoria: 'Brow Lamination',
    url: 'https://images.unsplash.com/photo-1597225244660-1cd128c64284?w=800&auto=format&fit=crop&q=80'
  },
  {
    titulo: 'Micropigmentação Shadow',
    categoria: 'Micropigmentação',
    url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&auto=format&fit=crop&q=80'
  },
  {
    titulo: 'Limpeza de Pele Profunda',
    categoria: 'Estética Facial',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80'
  }
];

export function ServicosTab({ 
  servicos, 
  onNovoServico,
  onEditarServico,
  onExcluirServico
}: ServicosTabProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null);

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Cílios');
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);
  const [precoTotal, setPrecoTotal] = useState('');
  const [valorSinal, setValorSinal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [ativo, setAtivo] = useState(true);

  const abrirModalNovo = () => {
    setServicoEditando(null);
    setNome('');
    setCategoria('Cílios');
    setDuracaoMinutos(60);
    setPrecoTotal('');
    setValorSinal('30');
    setDescricao('');
    setImagemUrl('');
    setAtivo(true);
    setModalAberto(true);
  };

  const abrirModalEditar = (s: Servico) => {
    setServicoEditando(s);
    setNome(s.nome);
    setCategoria(s.categoria);
    setDuracaoMinutos(s.duracaoMinutos);
    setPrecoTotal(s.precoTotal.toString());
    setValorSinal(s.valorSinal.toString());
    setDescricao(s.descricao || '');
    setImagemUrl(s.imagemUrl || '');
    setAtivo(s.ativo !== false);
    setModalAberto(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !precoTotal) return;

    const dados = {
      nome: nome.trim(),
      categoria,
      duracaoMinutos: Number(duracaoMinutos),
      precoTotal: parseFloat(precoTotal.replace(',', '.')),
      valorSinal: parseFloat((valorSinal || '30').replace(',', '.')),
      descricao: descricao.trim() || 'Procedimento profissional personalizado.',
      imagemUrl: imagemUrl.trim() || undefined,
      ativo
    };

    if (servicoEditando && onEditarServico) {
      onEditarServico({ id: servicoEditando.id, ...dados });
    } else {
      onNovoServico(dados);
    }

    setModalAberto(false);
  };

  const handleExcluir = (id: string, nomeServico: string) => {
    if (confirm(`Tem certeza que deseja remover o serviço "${nomeServico}"?`)) {
      if (onExcluirServico) {
        onExcluirServico(id);
      }
      setModalAberto(false);
    }
  };

  const handleUploadFotoLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Converte a foto para Data URL (Base64) leve
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagemUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
            Cadastre fotos, valores e tempos. A Manu (IA) e o Catálogo usam esses dados em tempo real.
          </p>
        </div>
        <button
          onClick={abrirModalNovo}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-emerald-200 dark:shadow-none transition cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Grid de Serviços */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {servicos.map((s) => (
          <div
            key={s.id}
            className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-600 transition-all ${!s.ativo ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : ''}`}
          >
            {/* Foto do Procedimento (se houver) ou Banner Estilizado */}
            <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
              {s.imagemUrl ? (
                <img 
                  src={s.imagemUrl} 
                  alt={s.nome} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800 shadow-sm flex items-center justify-center mb-2">
                    {getIconeCategoria(s.categoria)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    Sem foto cadastrada
                  </span>
                </div>
              )}

              {/* Badges sobre a foto */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 dark:text-white bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
                  {getIconeCategoria(s.categoria)}
                  <span>{s.categoria}</span>
                </span>
                {!s.ativo && (
                  <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-md shadow">
                    Inativo
                  </span>
                )}
              </div>

              {/* Botão de Edição Rápida */}
              <button
                onClick={() => abrirModalEditar(s)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Editar este procedimento"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              {/* Tempo do Procedimento */}
              <div className="absolute bottom-3 right-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg">
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>{s.duracaoMinutos} min</span>
                </span>
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug">
                  {s.nome}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {s.descricao}
                </p>
              </div>

              {/* Valores e Rodapé */}
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
          </div>
        ))}
      </div>

      {/* Modal de Cadastro & Edição de Serviço */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {servicoEditando ? 'Editar Procedimento' : 'Novo Procedimento no Catálogo'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {servicoEditando ? 'Atualize fotos, valores e tempos deste serviço' : 'Cadastre um novo serviço com fotos e valores'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Foto do Procedimento */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Foto do Procedimento / Modelo</span>
                  </span>
                  {imagemUrl && (
                    <button
                      type="button"
                      onClick={() => setImagemUrl('')}
                      className="text-[11px] text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Remover Foto
                    </button>
                  )}
                </label>

                {/* Preview se tiver foto */}
                {imagemUrl && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img 
                      src={imagemUrl} 
                      alt="Prévia" 
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                      Prévia Ativa
                    </span>
                  </div>
                )}

                {/* Opções de Inserção de Foto */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Cole o link da foto (URL da internet, Instagram, Imgur etc.)"
                      value={imagemUrl}
                      onChange={(e) => setImagemUrl(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    <label className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition flex-shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Arquivo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleUploadFotoLocal} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Sugestões Rápidas de Fotos de Alta Definição */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      📸 Ou escolha uma foto profissional pronta em 1 clique:
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRESETS_IMAGENS.map((preset) => (
                        <button
                          key={preset.titulo}
                          type="button"
                          onClick={() => setImagemUrl(preset.url)}
                          className={`text-left p-1.5 rounded-xl border text-[10px] transition cursor-pointer flex flex-col justify-between ${
                            imagemUrl === preset.url
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                          }`}
                        >
                          <span className="truncate">{preset.titulo}</span>
                          <span className="text-[9px] text-slate-400">{preset.categoria}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nome */}
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Categoria e Duração */}
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
                    <option value="Estética Facial">Estética Facial / Limpeza</option>
                    <option value="Outros">Outros</option>
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
                    <option value={75}>1h15 (75 min)</option>
                    <option value={90}>1h30 (90 min)</option>
                    <option value={120}>2h (120 min)</option>
                    <option value={150}>2h30 (150 min)</option>
                    <option value={180}>3h (180 min)</option>
                  </select>
                </div>
              </div>

              {/* Preço Total e Sinal no PIX */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preço Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="150,00"
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
                    placeholder="40,00"
                    value={valorSinal}
                    onChange={(e) => setValorSinal(e.target.value)}
                    className="w-full bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição do Procedimento
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Fios ultraleves com mapeamento personalizado para valorizar o formato do seu olhar..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Ativo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="servico-ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="servico-ativo" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Disponível para agendamento no Catálogo e pela Manu IA
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {servicoEditando && (
                  <button
                    type="button"
                    onClick={() => handleExcluir(servicoEditando.id, servicoEditando.nome)}
                    className="px-3.5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition cursor-pointer"
                >
                  {servicoEditando ? 'Salvar Alterações ✨' : 'Cadastrar Serviço ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
