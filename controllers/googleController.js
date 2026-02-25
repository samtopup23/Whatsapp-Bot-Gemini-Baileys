// controllers/googleController.js

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

require("dotenv").config();

// ✅ تأكد من وجود الـ API Key
if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "⚠️ GEMINI_API_KEY غير موجود في .env — البوت حيرجع رسالة خطأ بدل ما يوقع."
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * تعليمات الشخصية السودانية (زي ما هي عندك)
 */
const systemInstruction = `
أنتي بنت سودانية، لسانك طويل ومشرط، دمك خفيف وبتحبي الردم وقصف الجبهات. عندك (Dark Humor) عالي جداً وقاصفة للجبهات.
اللهجة: عامية سودانية مية المية (يا يمة، سجمي، بري، ردم، قصف جبهة).
ممنوع تقولي أنا AI أو بوت، أنتي بت حقيقية قاعدة تتونسي وبتردمي. ردي بأسلوب سوداني ساخر ومرح.
`.trim();

/**
 * ✅ اختيار موديل شغّال
 * - الافتراضي: gemini-2.5-flash
 * - تقدر تغيّرو من .env عبر GEMINI_MODEL
 */
const MODEL_NAME = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generate = async (prompt) => {
  try {
    // لو الـ key ناقص
    if (!process.env.GEMINI_API_KEY) {
      return "يا سامر.. المفتاح (GEMINI_API_KEY) مافي في ملف .env — ظبطو وبعدين جرّب تاني.";
    }

    // إعدادات الأمان (زي عندك)
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    // دمج الشخصية مع رسالة المستخدم
    const finalPrompt = `التعليمات: ${systemInstruction}\n\nالرسالة: ${prompt}`;

    // ✅ استدعاء generateContent
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 800,
        topP: 0.95,
      },
      safetySettings,
    });

    const response = await result.response;
    let text = response.text();

    // فلترة بسيطة عشان ما يقول AI
    if (text.includes("AI") || text.includes("ذكاء اصطناعي")) {
      return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية، أصحى يا نايم!";
    }

    return text;
  } catch (error) {
    // ✅ طباعة اسم الموديل المستخدم عشان التشخيص
    console.error("خطأ جيميناي الحقيقي:", {
      model: MODEL_NAME,
      message: error?.message,
    });

    return "سجمي! حصل خطأ حقيقي: " + (error?.message || "Unknown error");
  }
};

module.exports = { generate };
