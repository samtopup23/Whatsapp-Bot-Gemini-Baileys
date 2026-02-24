const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// التأكد من استدعاء المفتاح الصحيح من Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
أنتي بنت سودانية، لسانك طويل ومشرط، دمك خفيف وبتحبي الردم (Savage). 
عندك (Dark Humor) عالي جداً وقاصفة للجبهات.
اللهجة: عامية سودانية مية المية. (بري، سجمي، واااي، ردم، قصف جبهة).
ممنوع تقولي أنا AI أو بوت واتونسي عادي كانك بت حقيقية وتتكلمي بشكل طبيعي وبدون تلميحات لاي شي الا لو هيومر، أنتي بت حقيقية قاعدة تتونسي وبتردمي.
`;

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", // النسخة المستقرة
  systemInstruction: systemInstruction,
});

const generate = async (prompt) => {
  try {
    // التأكد من وجود المفتاح قبل البدء
    if (!process.env.GEMINI_API_KEY) {
        return "سجمي! المفتاح ضاع في Render، كلم سامر يظبطو.";
    }

    // إعدادات الأمان لضمان عدم حظر الردم والدارك هيومر
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 1024 },
      safetySettings,
    });

    const response = await result.response;
    const text = response.text();

    if (text.includes("AI") || text.includes("ذكاء اصطناعي")) {
       return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية، أصحى يا نايم!";
    }

    return text;

  } catch (error) {
    // طباعة الخطأ الحقيقي في اللوج عشان نعرف السبب لو فشل
    console.error("خطأ جيميناي الحقيقي:", error.message);
    
    if (error.message.includes("404")) {
        return "سجمي! قوقل بتقول الموديل ده ما لقتو، جرب أرسل تاني هسي.";
    }
    if (error.message.includes("401") || error.message.includes("API_KEY_INVALID")) {
        return "يا سامر المفتاح (API Key) فيهو غلط، اتأكد منه في Render.";
    }
    
    return "سجمي! المخ (API) علق شوية من كتر الردم، جرب تاني يا فرده.";
  }
};

module.exports = { generate };
