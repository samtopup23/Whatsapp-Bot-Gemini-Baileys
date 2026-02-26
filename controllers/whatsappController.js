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

// استدعاء مخ سوزي (GoogleController)
const { generate } = require("./googleController");

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

let sock;
let qr;
let soket;

/**
 * دالة الربط الأساسية مع واتساب
 */
const connectToWhatsApp = async () => {
  // حفظ الجلسة عشان ما يطلب QR كل مرة
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
  const { version } = await fetchLatestBaileysVersion();
  
  sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
    // إعدادات لتقوية الاتصال في بيئة Render
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000,
    generateHighQualityLinkPreview: true,
  });

  store.bind(sock.ev);

  // مراقبة حالة الاتصال
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ الشبكة جقمست شوية.. جاري إعادة محاولة الربط...");
        setTimeout(() => connectToWhatsApp(), 5000);
      } else {
        console.log("❌ تم تسجيل الخروج. امسح الكود من جديد.");
        deleteAuthData();
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("✅ سوزي هسي 'لايف' وصاحية.. الردم بدأ!");
    }
    
    if (update.qr) {
      qr = update.qr;
      updateQR("qr");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // استلام ومعالجة الرسائل
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify" && !messages[0].key.fromMe) {
      const m = messages[0];
      const noWa = m.key.remoteJid;
      const pushName = m.pushName || "يا زول"; // جلب الاسم للتحليل النفسي
      const pesan = m.message?.conversation || m.message?.extendedTextMessage?.text || "";

      if (!pesan) return;
      
      // مارك كـ "مقروء" طوالي
      await sock.readMessages([m.key]);

      try {
        // تجهيز بيانات السياق لسوزي
        const meta = { 
          fromName: pushName, 
          isGroup: noWa.endsWith('@g.us'),
          groupName: store.chats.get(noWa)?.name || ""
        };
        
        // إرسال الرسالة لعقل سوزي (جروق أو جيميناي)
        const response = await generate(noWa, pesan, meta);
        
        if (response) {
          // فحص لو في كود ملصق (Sticker) في الرد
          const stickerMatch = response.match(/\[\[STICKER:(.*?)\]\]/);
          // مسح الأكواد من النص عشان ما تظهر للزبون
          const cleanText = response.replace(/\[\[STICKER:.*?\]\]/g, "").trim();

          // 1. إظهار "جاري الكتابة" لإعطاء طابع بشري
          await sock.sendPresenceUpdate('composing', noWa);

          // 2. إرسال النص الأول (بتأخير بسيط كأنه زول بيكتب)
          if (cleanText) {
            setTimeout(async () => {
              await sock.sendMessage(noWa, { text: cleanText }, { quoted: m });
            }, 1500);
          }

          // 3. إرسال الملصق (لو سوزي قررت ترسلو بناءً على المود)
          if (stickerMatch) {
            const stickerUrl = stickerMatch[1].trim();
            setTimeout(async () => {
              await sock.sendMessage(noWa, { 
                sticker: { url: stickerUrl } 
              }, { quoted: m });
            }, 3000); // الملصق بيصل بعد النص بشوية عشان الواقعية
          }
        }
      } catch (error) {
        console.error("خطأ في معالجة رسالة سوزي:", error);
      }
    }
  });
};

/**
 * دوال مساعدة لإدارة الحالة والـ QR
 */
const deleteAuthData = () => {
  try { fs.rmSync("baileys_auth_info", { recursive: true, force: true }); } catch (e) {}
};

const isConnected = () => !!sock?.user;

const updateQR = (data) => {
  if (data === "qr") {
    qrcode.toDataURL(qr, (err, url) => { 
      if (soket) soket.emit("qr", url); 
    });
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
