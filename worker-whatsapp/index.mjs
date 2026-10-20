import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const API_URL = process.env.API_URL || 'https://www.studiobrunameireles.com.br/api/whatsapp';
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');
const QR_HTML_PATH = path.join(__dirname, 'qr.html');
const START_TIMESTAMP = Math.floor(Date.now() / 1000);

// Fila de debounce de mensagens para agrupar mensagens seguidas do mesmo cliente
const messageQueues = new Map();
const conversationHistories = new Map();

console.clear();
console.log(`
========================================================================
  ✨ STUDIO BRUNA MEIRELES - MANU IA (WHATSAPP AUTOMATION WORKER) ✨
========================================================================
  🚀 Modo: Micro-Worker Isolado (Zero Conflito com outras portas)
  🌐 Conectado à API: ${API_URL}
  📁 Sessão: ${AUTH_DIR}
========================================================================
`);

async function salvarQrHtml(qrCodeString) {
  try {
    const dataUrl = await QRCode.toDataURL(qrCodeString, { width: 320, margin: 2 });
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>QR Code - WhatsApp Studio Bruna Meireles</title>
  <meta http-equiv="refresh" content="20">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0e14; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 16px; padding: 32px; text-align: center; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { font-size: 20px; margin-bottom: 8px; color: #f59e0b; }
    p { font-size: 14px; color: #8b949e; line-height: 1.5; margin-bottom: 24px; }
    .qr-box { background: white; padding: 16px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .steps { text-align: left; background: #0d1117; padding: 16px; border-radius: 8px; font-size: 13px; color: #c9d1d9; margin-top: 20px; line-height: 1.6; }
    .steps ol { margin: 0; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📱 Conectar WhatsApp da Bruna</h1>
    <p>Escaneie o QR Code abaixo no WhatsApp do celular da Bruna para ativar a Manu IA:</p>
    <div class="qr-box">
      <img src="${dataUrl}" alt="QR Code WhatsApp" width="280" height="280" />
    </div>
    <div class="steps">
      <ol>
        <li>Abra o <strong>WhatsApp</strong> no celular</li>
        <li>Toque em <strong>Mais opções</strong> (⋮) ou <strong>Configurações</strong></li>
        <li>Selecione <strong>Aparelhos conectados</strong></li>
        <li>Toque em <strong>Conectar um aparelho</strong></li>
        <li>Aponte a câmera para este QR Code</li>
      </ol>
    </div>
  </div>
</body>
</html>`;
    fs.writeFileSync(QR_HTML_PATH, htmlContent, 'utf-8');
  } catch (err) {
    // Silencioso se falhar gravação de HTML
  }
}

function limparQrHtml() {
  if (fs.existsSync(QR_HTML_PATH)) {
    try {
      fs.unlinkSync(QR_HTML_PATH);
    } catch (_) {}
  }
}

async function iniciarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: true }));

  console.log(`📦 Usando Baileys v${version.join('.')} (Última: ${isLatest})`);
  console.log(`⏳ Inicializando conexão com servidores do WhatsApp...`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
    browser: ['Studio Bruna Meireles', 'Chrome', '124.0.0.0'],
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📲 QR CODE GERADO COM SUCESSO! Escaneie agora pelo WhatsApp:');
      qrcodeTerminal.generate(qr, { small: true });
      await salvarQrHtml(qr);
      console.log(`💡 Dica: Se o QR Code acima não ficar nítido no seu terminal, você também pode abrir este arquivo no navegador:`);
      console.log(`   🔗 ${QR_HTML_PATH}\n`);

      // Sincroniza com o Painel Web para exibir o QR Code ao vivo no modal do site!
      try {
        const qrBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'atualizar_qrcode', qrCode: qrBase64 })
        });
        const resJson = await res.json().catch(() => ({}));
        console.log(`🌐 QR Code sincronizado com o site: HTTP ${res.status}`, resJson);
      } catch (err) {
        console.error('❌ Erro ao sincronizar QR Code com o site:', err.message);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const deveReconectar = statusCode !== DisconnectReason.loggedOut;
      console.log(`\n⚠️ Conexão encerrada. Código de status: ${statusCode || 'desconhecido'}.`);

      limparQrHtml();

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`❌ A sessão foi desconectada no aparelho. Limpando credenciais antigas...`);
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (_) {}
        try {
          fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'desconectar_whatsapp' })
          }).catch(() => {});
        } catch (_) {}
        console.log(`🔄 Reiniciando para gerar um novo QR Code...`);
        setTimeout(iniciarWhatsApp, 2000);
      } else if (deveReconectar) {
        console.log(`🔄 Reconectando automaticamente em 3 segundos...`);
        setTimeout(iniciarWhatsApp, 3000);
      }
    } else if (connection === 'open') {
      limparQrHtml();
      const userJid = sock.user?.id?.split(':')[0] || 'Conectado';
      console.log(`
========================================================================
  🟢 CONECTADO COM SUCESSO AO WHATSAPP!
  📱 Número Conectado: ${userJid}
  🤖 Manu IA Ativa: Atendendo clientes 24/7 com inteligência
  ✨ Mantenha esta janela aberta para manter o atendimento funcionando.
========================================================================
`);
      // Sincroniza status no Painel Web
      try {
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'atualizar_status_whatsapp',
            status: 'conectado',
            telefoneConectado: userJid,
            qrCode: ''
          })
        }).catch(() => {});
      } catch (_) {}
    }
  });

  // Escuta novas mensagens
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        // Ignorar mensagens enviadas por nós mesmos
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid) continue;

        // Ignorar grupos e transmissões/status
        if (remoteJid.endsWith('@g.us') || remoteJid.includes('@broadcast') || remoteJid === 'status@broadcast') {
          continue;
        }

        // Ignorar mensagens antigas antes do worker iniciar (evita responder fila retroativa)
        const msgTime = Number(msg.messageTimestamp) || 0;
        if (msgTime > 0 && msgTime < START_TIMESTAMP - 60) {
          continue;
        }

        // Extrair texto da mensagem
        let texto =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          '';

        // Suporte inteligente para mídias: Áudios, Fotos/Comprovantes, Figurinhas e Documentos
        if (msg.message?.imageMessage) {
          texto = texto ? `[CLIENTE_ENVIOU_FOTO_OU_COMPROVANTE] ${texto}` : '[CLIENTE_ENVIOU_FOTO_OU_COMPROVANTE]';
        } else if (msg.message?.audioMessage) {
          texto = '[CLIENTE_ENVIOU_AUDIO]';
        } else if (msg.message?.stickerMessage) {
          texto = '[CLIENTE_ENVIOU_FIGURINHA]';
        } else if (msg.message?.documentMessage) {
          texto = texto ? `[CLIENTE_ENVIOU_DOCUMENTO_OU_COMPROVANTE] ${texto}` : '[CLIENTE_ENVIOU_DOCUMENTO_OU_COMPROVANTE]';
        }

        if (!texto || !texto.trim()) continue;

        // Resolução inteligente de Telefone e WhatsApp LID:
        // Se o cliente não estiver nos contatos do WhatsApp ou usar privacidade, o WhatsApp mascara como LID (ex: 199712439275521@lid)
        const isLid = remoteJid.endsWith('@lid');
        let telefoneReal = '';

        if (msg.key?.senderPn) {
          telefoneReal = msg.key.senderPn.replace('@s.whatsapp.net', '').replace(/\D/g, '');
        } else if (msg.key?.participantPn) {
          telefoneReal = msg.key.participantPn.replace('@s.whatsapp.net', '').replace(/\D/g, '');
        } else if (msg.key?.remoteJidAlt && !msg.key.remoteJidAlt.endsWith('@lid')) {
          telefoneReal = msg.key.remoteJidAlt.replace('@s.whatsapp.net', '').replace(/\D/g, '');
        }

        const rawDigits = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/\D/g, '');
        const telefone = telefoneReal || rawDigits;
        const nomeCliente = msg.pushName || 'Cliente';

        console.log(`\n📩 [Mensagem Recebida] de ${nomeCliente} (${telefoneReal ? telefoneReal : (isLid ? `LID WhatsApp: ${telefone}` : telefone)}):`);
        console.log(`   "${texto.trim()}"`);

        // Debounce: se a cliente enviar várias frases em poucos segundos, agrupa em uma só
        const debounceKey = remoteJid;
        if (messageQueues.has(debounceKey)) {
          const item = messageQueues.get(debounceKey);
          clearTimeout(item.timer);
          item.textos.push(texto.trim());
        } else {
          messageQueues.set(debounceKey, {
            textos: [texto.trim()],
            timer: null
          });
        }

        // Ativa "digitando..." no WhatsApp para o cliente ver que a Manu está respondendo
        try {
          await sock.sendPresenceUpdate('composing', remoteJid);
        } catch (_) {}

        // Aguarda 3 segundos para dar tempo de agrupar mensagens e simular digitação natural
        const item = messageQueues.get(debounceKey);
        item.timer = setTimeout(async () => {
          const textosParaProcessar = item.textos.join('\n');
          messageQueues.delete(debounceKey);

          try {
            const historico = conversationHistories.get(remoteJid) || [];
            console.log(`⏳ Processando com Manu IA via ${API_URL}...`);
            const respostaApi = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'simular_mensagem',
                mensagem: textosParaProcessar,
                clienteNome: nomeCliente,
                telefone: telefone,
                isLid: isLid || (!telefoneReal && rawDigits.length > 13),
                remoteJid: remoteJid,
                historico: historico
              })
            });

            if (!respostaApi.ok) {
              throw new Error(`API retornou status HTTP ${respostaApi.status}`);
            }

            const data = await respostaApi.json();

            if (data && data.respostaBot) {
              // Atualiza o histórico de conversas na memória (últimos 10 turnos)
              historico.push({ role: 'user', text: textosParaProcessar });
              historico.push({ role: 'model', text: data.respostaBot });
              if (historico.length > 10) {
                historico.splice(0, historico.length - 10);
              }
              conversationHistories.set(remoteJid, historico);

              // Pausa o digitando
              try {
                await sock.sendPresenceUpdate('paused', remoteJid);
              } catch (_) {}

              // Envia a resposta oficial no WhatsApp da cliente
              await sock.sendMessage(remoteJid, { text: data.respostaBot });

              console.log(`💬 [Manu IA Respondeu para ${nomeCliente} (${data.motorUtilizado || 'IA'})]:`);
              console.log(`   ${data.respostaBot.split('\n')[0]}...`);

              if (data.agendamentoCriado) {
                console.log(`   🗓️ Agendamento registrado: ${data.agendamentoCriado.servicoNome} às ${data.agendamentoCriado.horario}`);
              }
              if (data.pedidoCriado) {
                console.log(`   📦 Pedido registrado: ${data.pedidoCriado.tipoEntrega} (R$ ${data.pedidoCriado.valorTotal.toFixed(2)})`);
              }
            }
          } catch (err) {
            console.error(`❌ Erro ao processar mensagem de ${nomeCliente}:`, err.message || err);
            try {
              await sock.sendPresenceUpdate('paused', remoteJid);
            } catch (_) {}
          }
        }, 3200);

      } catch (err) {
        console.error('❌ Erro no loop de mensagens:', err);
      }
    }
  });
}

// Inicia o processo
iniciarWhatsApp().catch((err) => {
  console.error('❌ Erro fatal ao iniciar o worker do WhatsApp:', err);
});
