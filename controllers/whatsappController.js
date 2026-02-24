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

// استدعاء ملف التحكم بجيميناي
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
      switch (reason) {
        case DisconnectReason.badSession:
          console.log(`Bad Session File, Please Delete session and Scan Again`);
          deleteAuthData();
          break;
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.restartRequired:
        case DisconnectReason.timedOut:
          console.log("Connection closed, reconnecting....");
          connectToWhatsApp();
          break;
        case DisconnectReason.connectionReplaced:
          console.log("Connection Replaced, Please Close Current Session First");
          deleteAuthData();
          connectToWhatsApp();
          break;
        case DisconnectReason.loggedOut:
          console.log(`Device Logged Out, Please Delete session and Scan Again.`);
          deleteAuthData();
          connectToWhatsApp();
          break;
        default:
          console.log(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
      }
    } else if (connection === "open") {
      console.log("الربط تم بنجاح يا سامر! البوت شغال هسي.");
      return;
    }
    if (update.qr) {
      qr = update.qr;
      updateQR("qr");
    } else if (update.connection === "open") {
      updateQR("qrscanned");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // حتة استلام الرسايل والرد التلقائي بشخصية البت السودانية
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify" && !messages[0].key.fromMe) {
      const m = messages[0];
      // استخراج النص من الرسالة سواء كانت نصية عادية أو رد على رسالة
      const pesan = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
      const noWa = m.key.remoteJid;

      if (!pesan) return;

      // تعليم البوت إنه يقرأ الرسالة (Seen)
      await sock.readMessages([m.key]);

      // الرد التلقائي: البوت حيرد على أي كلام يجي في الخاص أو القروب
      // ملاحظة: لو داير تشغل الدارك هيومر والشخصية، لازم تظبط "البرومبت" في googleController
      try {
        const response = await generate(pesan);
        
        if (response) {
          // إضافة تأخير بسيط (Delay) عشان يبان كأنه بشر بيكتب
          await sock.sendPresenceUpdate('composing', noWa);
          setTimeout(async () => {
            await sock.sendMessage(
              noWa,
              { text: response },
              { quoted: m } // الرد يكون (Reply) على الرسالة الأصلية
            );
          }, 2000); // تأخير ثانيتين
        }
      } catch (error) {
        console.error("خطأ في جيميناي:", error);
      }
    }
  });
};

const deleteAuthData = () => {
  try {
    fs.rmSync("baileys_auth_info", { recursive: true, force: true });
  } catch (error) {
    console.error("Error deleting authentication data:", error);
  }
};

const isConnected = () => !!sock?.user;

const updateQR = (data) => {
  switch (data) {
    case "qr":
      qrcode.toDataURL(qr, (err, url) => {
        soket?.emit("qr", url);
      });
      break;
    case "connected":
      soket?.emit("qrstatus", "./assets/check.svg");
      break;
    default:
      break;
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

// استدعاء ملف التحكم بجيميناي
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
      switch (reason) {
        case DisconnectReason.badSession:
          console.log(`Bad Session File, Please Delete session and Scan Again`);
          deleteAuthData();
          break;
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.restartRequired:
        case DisconnectReason.timedOut:
          console.log("Connection closed, reconnecting....");
          connectToWhatsApp();
          break;
        case DisconnectReason.connectionReplaced:
          console.log("Connection Replaced, Please Close Current Session First");
          deleteAuthData();
          connectToWhatsApp();
          break;
        case DisconnectReason.loggedOut:
          console.log(`Device Logged Out, Please Delete session and Scan Again.`);
          deleteAuthData();
          connectToWhatsApp();
          break;
        default:
          console.log(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
      }
    } else if (connection === "open") {
      console.log("الربط تم بنجاح يا سامر! البوت شغال هسي.");
      return;
    }
    if (update.qr) {
      qr = update.qr;
      updateQR("qr");
    } else if (update.connection === "open") {
      updateQR("qrscanned");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // حتة استلام الرسايل والرد التلقائي بشخصية البت السودانية
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify" && !messages[0].key.fromMe) {
      const m = messages[0];
      // استخراج النص من الرسالة سواء كانت نصية عادية أو رد على رسالة
      const pesan = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
      const noWa = m.key.remoteJid;

      if (!pesan) return;

      // تعليم البوت إنه يقرأ الرسالة (Seen)
      await sock.readMessages([m.key]);

      // الرد التلقائي: البوت حيرد على أي كلام يجي في الخاص أو القروب
      // ملاحظة: لو داير تشغل الدارك هيومر والشخصية، لازم تظبط "البرومبت" في googleController
      try {
        const response = await generate(pesan);
        
        if (response) {
          // إضافة تأخير بسيط (Delay) عشان يبان كأنه بشر بيكتب
          await sock.sendPresenceUpdate('composing', noWa);
          setTimeout(async () => {
            await sock.sendMessage(
              noWa,
              { text: response },
              { quoted: m } // الرد يكون (Reply) على الرسالة الأصلية
            );
          }, 2000); // تأخير ثانيتين
        }
      } catch (error) {
        console.error("خطأ في جيميناي:", error);
      }
    }
  });
};

const deleteAuthData = () => {
  try {
    fs.rmSync("baileys_auth_info", { recursive: true, force: true });
  } catch (error) {
    console.error("Error deleting authentication data:", error);
  }
};

const isConnected = () => !!sock?.user;

const updateQR = (data) => {
  switch (data) {
    case "qr":
      qrcode.toDataURL(qr, (err, url) => {
        soket?.emit("qr", url);
      });
      break;
    case "connected":
      soket?.emit("qrstatus", "./assets/check.svg");
      break;
    default:
      break;
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
