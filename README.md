# ✨ Studio Bella • Sistema Inteligente com IA & Gestão Completa

Plataforma completa de gestão de beleza e estética facial, com recepcionista virtual inteligente movida a Google Gemini AI, agendamento de serviços, vendas de produtos com cálculo de frete, controle financeiro, controle de estoque e catálogo público para a bio do Instagram.

---

## 🚀 Funcionalidades Principais

- 🤖 **Manu (IA Recepcionista no WhatsApp):** Atendimento humanizado, tira dúvidas sobre procedimentos (cílios, sobrancelhas, limpeza de pele), consulta horários livres na agenda, cobra sinal de agendamento via PIX e cadastra clientes automaticamente.
- 🎂 **Clube de Aniversariantes VIP:** Captura automática de data de aniversário, endereço e CEP. Filtro rápido de aniversariantes do mês e disparo de presentes/descontos em 1 clique.
- 🛍️ **Catálogo Digital para a Bio do Instagram (`/catalogo`):** Visual moderno para clientes visualizarem os procedimentos, produtos home-care e solicitarem agendamentos/pedidos diretamente no WhatsApp.
- 📦 **Venda de Produtos & E-commerce:** Controle de estoque com alerta de reposição, opções de entrega (Retirada no Studio, Motoboy Express e Correios) e cálculo automático de frete via CEP.
- 💰 **Fluxo de Caixa & Financeiro:** Registro automático de entradas (sinais de agendamento, pagamentos em balcão, vendas de produtos) e controle de saídas/custos.
- 💳 **Checkout Mercado Pago (Opcional):** Suporte a links de pagamento e parcelamento no cartão em até 12x.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend & Backend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Inteligência Artificial:** Google Generative AI (`gemini-3.5-flash-lite` / `gemini-1.5-flash`)
- **Banco de Dados:** Supabase (PostgreSQL para Produção) com fallback automático local
- **Ícones & UI:** Lucide React, Safe Area Insets (Mobile-First)

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```env
# Google Gemini AI
GEMINI_API_KEY=sua_chave_do_google_ai_studio

# Supabase (Banco de Dados em Produção)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Mercado Pago (Opcional)
MERCADO_PAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
```

---

## 🗄️ Configuração do Banco de Dados no Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Acesse o **SQL Editor** no painel do Supabase.
3. Copie e execute o conteúdo do arquivo [`supabase_schema.sql`](./supabase_schema.sql).
4. Adicione as chaves nas variáveis de ambiente da Vercel.

---

## 🌐 Deploy na Vercel

1. Importe o repositório no dashboard da [Vercel](https://vercel.com).
2. Configure as variáveis de ambiente acima.
3. Clique em **Deploy**! A cada `git push` na branch `main`, a Vercel atualiza o site automaticamente.
