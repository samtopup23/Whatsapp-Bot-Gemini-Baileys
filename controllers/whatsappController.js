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

// استدعاء دالة التوليد المحدثة التي تدعم الذاكرة والملصقات
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
    // إعدادات إضافية لثبات الاتصال في ريندر
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
  });

  store.bind(sock.ev);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("الشبكة جقمست.. جاري إعادة الاتصال...");
        setTimeout(() => connectToWhatsApp(), 5000);
      } else {
        console.log("تم تسجيل الخروج.. امسح الكود تاني.");
        deleteAuthData();
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("الربط تم! سوزي هسي شقّاقة وصاحية 24 ساعة.");
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
      const noWa = m.key.remoteJid;
      const pushName = m.pushName || "يا غالي"; // جلب اسم المستخدم للوناسة
      const pesan = m.message?.conversation || m.message?.extendedTextMessage?.text || "";

      if (!pesan) return;
      await sock.readMessages([m.key]);

      try {
        // تمرير رقم الواتساب، الرسالة، ومعلومات إضافية (الاسم والنوع) لسوزي
        const meta = { 
          fromName: pushName, 
          isGroup: noWa.endsWith('@g.us') 
        };
        
        const response = await generate(noWa, pesan, meta);
        
        if (response) {
          // فحص لو في كود ملصق (Sticker) في الرد
          const stickerMatch = response.match(/\[\[STICKER:(.*?)\]\]/);
          // تنظيف النص من كود الملصق قبل الإرسال
          const cleanText = response.replace(/\[\[STICKER:.*?\]\]/g, "").trim();

          // 1. إرسال النص (لو موجود)
          if (cleanText) {
            await sock.sendPresenceUpdate('composing', noWa);
            setTimeout(async () => {
              await sock.sendMessage(noWa, { text: cleanText }, { quoted: m });
            }, 1000);
          }

          // 2. إرسال الملصق (لو سوزي قررت ترسله)
          if (stickerMatch) {
            const stickerUrl = stickerMatch[1].trim();
            // تأخير بسيط لإعطاء طابع بشري (كأنها بترسل النص ثم الملصق)
            setTimeout(async () => {
              await sock.sendMessage(noWa, { 
                sticker: { url: stickerUrl } 
              }, { quoted: m });
            }, 2500);
          }
        }
      } catch (error) {
        console.error("خطأ سوزي اللوجيستي:", error);
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
