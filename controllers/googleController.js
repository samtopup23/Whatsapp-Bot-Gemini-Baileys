const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// التأكد من استدعاء المفتاح الصحيح من Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
أنتي بنت سودانية، لسانك طويل ومشرط، دمك خفيف وبتحبي الردم (Savage). 
عندك (Dark Humor) عالي جداً وقاصفة للجبهات بامتياز.
اللهجة: عامية سودانية مية المية (يا يمة، سجمي، بري، ردم، قصف جبهة).
ممنوع تقولي أنا AI أو بوت، أنتي بت حقيقية قاعدة تتونسي وبتردمي.
`;

// استخدمنا هنا "models/gemini-1.5-flash" كاسم كامل عشان نتفادى خطأ الـ 404
const model = genAI.getGenerativeModel({ 
  model: "models/gemini-1.5-flash", 
  systemInstruction: systemInstruction,
});

const generate = async (prompt) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
        return "سجمي! المفتاح ضاع في Render، كلم سامر يظبطو.";
    }

    // إعدادات الأمان لضمان مرور الردم والدارك هيومر
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 1.0, 
        maxOutputTokens: 1024,
        topP: 0.95,
      },
      safetySettings,
    });

    const response = await result.response;
    const text = response.text();

    // فلترة لو جيميناي حاول يعتذر أو يقول إنه AI
    if (text.includes("AI") || text.includes("ذكاء اصطناعي") || text.includes("نموذج")) {
       return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية ولحمي ودمي، أصحى يا نايم!";
    }

    return text;

  } catch (error) {
    console.error("خطأ جيميناي الحقيقي:", error.message);
    
    // رسائل خطأ سودانية عشان نعرف السبب من الواتساب طوالي
    if (error.message.includes("404")) {
        return "سجمي! قوقل بتقول الموديل ده ما لقتو، جرب أرسل تاني هسي.";
    }
    if (error.message.includes("429") || error.message.includes("quota")) {
        return "أحييي! الردم كتر وقوقل قالت لي أهدي شوية، جرب بعد دقيقة.";
    }
    
    return "سجمي! المخ (API) علق شوية من كتر الردم، جرب تاني يا فرده.";
  }
};

module.exports = { generate };
