const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  makeInMemoryStore,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode");
const fs = require("fs");
const pino = require("pino");

// استدعاء دالة التوليد المحدثة التي تدعم الذاكرة
const { generate } = require("./googleController");

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

let sock;
let qr;
let soket;

const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: "silent" }),
    version,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
  });

  store.bind(sock.ev);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect.error).output.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        connectToWhatsApp();
      } else {
        deleteAuthData();
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("الربط تم بنجاح يا سامر! سوزي هسي جاهزة للونسة والردم.");
    }
    if (update.qr) {
      qr = update.qr;
      updateQR("qr");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify" && !messages[0].key.fromMe) {
      const m = messages[0];
      const pesan = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
      const noWa = m.key.remoteJid; // هذا هو الرقم الذي سنستخدمه كمعرف للذاكرة

      if (!pesan) return;
      await sock.readMessages([m.key]);

      try {
        // تمرير الرقم والرسالة معاً لتفعيل نظام الذاكرة المستمرة
        const response = await generate(noWa, pesan);
        
        if (response) {
          // إضافة تأثير "جاري الكتابة" لإضفاء طابع بشري
          await sock.sendPresenceUpdate('composing', noWa);
          
          setTimeout(async () => {
            await sock.sendMessage(
              noWa, 
              { text: response }, 
              { quoted: m } // الرد كـ (Reply) لجعل المحادثة تبدو كأنها ونسة بشرية
            );
          }, 1500);
        }
      } catch (error) {
        console.error("خطأ في معالجة رسالة سوزي:", error);
      }
    }
  });
};

const deleteAuthData = () => {
  try { fs.rmSync("baileys_auth_info", { recursive: true, force: true }); } catch (e) {}
};

const isConnected = () => !!sock?.user;

const updateQR = (data) => {
  if (data === "qr") {
    qrcode.toDataURL(qr, (err, url) => { soket?.emit("qr", url); });
  }
};

const getQR = () => qr;
const setSocket = (socket) => { soket = socket; };

module.exports = {
  connectToWhatsApp,
  updateQR,
  isConnected,
  setSocket,
  getQR,
};
