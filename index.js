const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const QRCode = require("qrcode"); // أضفنا المكتبة دي عشان تحول الكود لصورة
const webRoutes = require("./routes/webRoute"); 

const {
  connectToWhatsApp,
  setSocket,
  isConnected,
  getQR,
  updateQR,
} = require("./controllers/whatsappController");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(__dirname, "client/assets")));

// --- الحنك الجديد: رابط الـ QR Code كصورة ---
app.get("/qr", async (req, res) => {
  const qrString = getQR(); // بنجيب الكود من الكنترولر
  if (qrString && !isConnected()) {
    try {
      res.setHeader("Content-Type", "image/png");
      await QRCode.toFileStream(res, qrString); // بيحول النص لصورة PNG
    } catch (err) {
      res.status(500).send("في خطأ حصل وأنا بصنع الصورة.");
    }
  } else if (isConnected()) {
    res.send("<h1>يا سامر، البوت مرتبط وشغال مية المية!</h1>");
  } else {
    res.send("<h1>الـ QR Code لسه ما ظهر في السيرفر، انتظر ثواني واعمل Refresh.</h1>");
  }
});
// -------------------------------------------

app.use("/", webRoutes); 

io.on("connection", (socket) => {
  setSocket(socket);
  if (isConnected()) {
    updateQR("connected");
  } else if (getQR()) {
    updateQR("qr");
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`تقدر تفتح الـ QR من الرابط: http://localhost:${port}/qr`);
  connectToWhatsApp();
});
