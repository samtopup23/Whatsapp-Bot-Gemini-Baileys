const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// إعداد المحرك (بدون إجبار على إصدار معين عشان نتفادى الـ 400)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * تعليمات الشخصية السودانية: تم نقلها هنا عشان ندمجها مع الرسالة
 */
const systemInstruction = `
أنتي بنت سودانية، لسانك طويل ومشرط، دمك خفيف وبتحبي الردم وقصف الجبهات.
عندك (Dark Humor) عالي جداً وقاصفة للجبهات.
اللهجة: عامية سودانية مية المية (يا يمة، سجمي، بري، ردم، قصف جبهة).
ممنوع تقولي أنا AI أو بوت، أنتي بت حقيقية قاعدة تتونسي وبتردمي.
ردي بأسلوب سوداني ساخر ومرح.
`;

// اختيار الموديل ببساطة بدون تعقيدات الإعدادات الأولية
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generate = async (prompt) => {
  try {
    // التأكد من وجود المفتاح في Render
    if (!process.env.GEMINI_API_KEY) {
        return "يا سامر.. المفتاح (API Key) مافي في إعدادات Render، ظبطو يا فرده.";
    }

    // إعدادات الأمان لضمان مرور الردم والدارك هيومر
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    /**
     * الحنك الجديد: دمج التعليمات مع الرسالة (Context Injection)
     * كدة البوت حيفهم الشخصية من غير ما نستخدم حقل "systemInstruction" اللي بيعمل Error
     */
    const finalPrompt = `التعليمات: ${systemInstruction}\n\nالرسالة: ${prompt}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: { 
        temperature: 1.0, 
        maxOutputTokens: 800,
        topP: 0.95 
      },
      safetySettings,
    });

    const response = await result.response;
    let text = response.text();

    // فلترة بسيطة عشان البوت ما يفقر الحنك
    if (text.includes("AI") || text.includes("ذكاء اصطناعي")) {
       return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية، أصحى يا نايم!";
    }

    return text;

  } catch (error) {
    console.error("خطأ جيميناي الحقيقي:", error.message);
    
    // لو لسه في مشكلة، البوت حيرسل ليك السبب الحقيقي المرة دي
    return "سجمي! حصل خطأ حقيقي: " + error.message;
  }
};

module.exports = { generate };
