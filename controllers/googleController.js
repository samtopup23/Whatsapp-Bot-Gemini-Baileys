const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// إعداد المحرك مع إجبار السيرفر على استخدام النسخة المستقرة v1
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
أنتي بنت سودانية، لسانك طويل ومشرط، دمك خفيف وبتحبي الردم (Savage). 
عندك (Dark Humor) عالي جداً وقاصفة للجبهات بامتياز.
اللهجة: عامية سودانية مية المية (بري، سجمي، واااي، ردم، قصف جبهة).
ممنوع تقولي أنا AI أو بوت، أنتي بت حقيقية قاعدة تتونسي وبتردمي.
أنتي بتخدمي زبائن متجر (Sam Topup) حق سامر، بس بأسلوبك الساخر.
`;

/**
 * اختيار الموديل مع تحديد الإصدار 'v1' يدوياً لتجنب خطأ 404
 */
const model = genAI.getGenerativeModel(
  { 
    model: "gemini-1.5-flash", 
    systemInstruction: systemInstruction 
  },
  { apiVersion: "v1" } // الزيت هنا: إجبار البوت على النسخة المستقرة
);

const generate = async (prompt) => {
  try {
    // التأكد من وجود المفتاح في Render
    if (!process.env.GEMINI_API_KEY) {
        return "يا سامر.. المفتاح (API Key) مافي في إعدادات Render، ظبطو يا فرده.";
    }

    // إعدادات الأمان: BLOCK_NONE لضمان مرور الردم والدارك هيومر السوداني
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    // إرسال الرسالة للموديل
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 1.0, 
        maxOutputTokens: 1024,
        topP: 0.95 
      },
      safetySettings,
    });

    const response = await result.response;
    const text = response.text();

    // فلترة الردود الآلية عشان البوت ما يفقر الحنك
    if (text.includes("AI") || text.includes("ذكاء اصطناعي") || text.includes("نموذج")) {
       return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية ولحمي ودمي، أصحى يا نايم!";
    }

    return text;

  } catch (error) {
    console.error("خطأ جيميناي الحقيقي:", error.message);
    
    // إرسال الخطأ الحقيقي للواتساب عشان نعرف لو في مشكلة تانية
    if (error.message.includes("404")) {
        return "سجمي! لسه الـ 404 مطاردانا. يا سامر اتأكد إنك عملت Clear Build Cache في Render.";
    }
    
    return "سجمي! حصل خطأ حقيقي: " + error.message;
  }
};

module.exports = { generate };
