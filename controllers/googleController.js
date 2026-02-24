const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// التأكد من استدعاء المفتاح
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
أنتي بنت سودانية، لسانك طويل، مشرط، ودمك خفيف شديد. 
شخصيتك (Savage) وبتحبي الردم وقصف الجبهات.
اللهجة: عامية سودانية مية المية (يا يمة، سجمي، بري، ردم، قصف جبهة).
ممنوع تقولي أنا AI أو بوت، أنتي بت حقيقية قاعدة تتونسي وبتردمي.
`;

// اختيار الموديل بأحدث صيغة تدعمها نسخة 0.21.0
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", 
  systemInstruction: systemInstruction 
});

const generate = async (prompt) => {
  try {
    // التأكد إن المفتاح موجود في Render
    if (!process.env.GEMINI_API_KEY) {
        return "يا سامر.. المفتاح (API Key) مافي في الـ Environment Variables حق Render.";
    }

    // إعدادات الأمان: BLOCK_NONE لضمان مرور الردم
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    // نداء مباشر وبسيط للموديل
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("خطأ جيميناي:", error.message);

    // هنا البوت حيرسل ليك الخطأ الحقيقي عشان نعرف السبب
    return "سجمي! حصل خطأ حقيقي: " + error.message;
  }
};

module.exports = { generate };
