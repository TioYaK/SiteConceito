# 📱 Worker WhatsApp Isolado - Studio Bruna Meireles & Manu IA

Este worker conecta o WhatsApp físico do celular da Bruna diretamente à **Manu (IA Recepcionista)** do Studio Bruna Meireles.

---

## 🛡️ Zero Conflito com seu Computador
- **Sem portas HTTP ocupadas:** Não utiliza nenhuma porta de servidor (como 3000, 3005, 7070 etc.), prevenindo 100% qualquer conflito com seus outros workers ou servidores.
- **Isolado:** Possui sua própria pasta de dependências e arquivos de autenticação (`auth_info_baileys/`).

---

## 🚀 Como Iniciar

### Opção 1 (Mais fácil - 1 Clique no Windows)
Dê um **duplo clique** no arquivo:
👉 `iniciar-whatsapp.bat` (na raiz do projeto)

### Opção 2 (Via Terminal)
```bash
npm run worker:whatsapp
```
ou
```bash
cd worker-whatsapp
npm start
```

---

## 📲 Como Conectar o Aparelho da Bruna
1. Ao iniciar o script, um **QR Code** será exibido no terminal.
2. Abra o WhatsApp no celular da Bruna.
3. Vá em **Mais opções** (⋮ no Android) ou **Configurações** (no iPhone) > **Aparelhos Conectados**.
4. Toque em **Conectar um aparelho** e aponte a câmera para o QR Code.
5. Pronto! Uma vez conectado, você verá a mensagem:
   `🟢 CONECTADO COM SUCESSO AO WHATSAPP!`

> 💡 **Dica:** Se a fonte do seu terminal não exibir o QR Code em alta definição, um arquivo `qr.html` é criado temporariamente dentro de `worker-whatsapp/`. Basta dar duplo clique nele para abri-lo no seu navegador e escanear!
