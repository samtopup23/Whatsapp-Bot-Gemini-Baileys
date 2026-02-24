const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// إعداد المحرك الأساسي
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * تعليمات الشخصية: البت السودانية الـ Savage
 * تم دمج التعليمات هنا لضمان عملها حتى لو ما اتوجدت في Render
 */
const defaultInstruction = `
أنتي بنت سودانية، لسانك طويل، مشرط، ودمك خفيف شديد. 
شخصيتك (Savage) وبتحبي الردم وقصف الجبهات.
اللهجة: عامية سودانية مية المية (يا يمة، سجمي، بري، أحيي، ردم، قصف جبهة).
ممنوع تقولي أنا AI أو بوت، أنتي بت حقيقية قاعدة تتونسي وبتردمي في الناس.
لو زول سألك سؤال تافه، أردميهو ردمة تخليهو يكره اليوم الدخل فيهو القروب.
أستخدمي الـ (Dark Humor) السوداني الساخر في ردودك.
`;

// اختيار التعليمات: لو في تعليمات في Render يشيلها، لو مافي يشيل الافتراضية حقتنا
const finalInstruction = process.env.SYSTEM_INSTRUCTION || defaultInstruction;

/**
 * إعدادات الأمان: BLOCK_NONE لضمان مرور الردم والدارك هيومر
 */
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * دالة توليد الرد مع نظام (Retry) لموديلات مختلفة
 */
const generate = async (prompt) => {
  try {
    // التأكد من وجود المفتاح
    if (!process.env.GEMINI_API_KEY) {
      return "سجمي! المفتاح ضاع في Render، كلم سامر يظبطو.";
    }

    // المحاولة الأولى باستخدام الموديل الأساسي (Flash)
    // لاحظ حذف كلمة "models/" لأن النسخة الجديدة أحياناً بترفضها
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: finalInstruction 
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 1024 },
      safetySettings,
    });

    const response = await result.response;
    let text = response.text();

    // فلترة الردود الآلية
    if (text.includes("AI") || text.includes("ذكاء اصطناعي")) {
       return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية، أصحى يا نايم!";
    }

    return text;

  } catch (error) {
    console.error("خطأ جيميناي الحقيقي يا سامر:", error.message);

    // لو الخطأ 404، حنجرب ننادي الموديل بالاسم الكامل (كخطة بديلة)
    if (error.message.includes("404") || error.message.includes("not found")) {
      try {
        const fallbackModel = genAI.getGenerativeModel({ 
          model: "models/gemini-1.5-flash", // المحاولة بالاسم الكامل
          systemInstruction: finalInstruction 
        });
        const result = await fallbackModel.generateContent(prompt);
        return (await result.response).text();
      } catch (innerError) {
        return "سجمي! قوقل لسه غضبانة، جرب أرسل رسالة تانية بعد دقيقة.";
      }
    }

    // تعامل مع تخطي الحصة (Quota)
    if (error.message.includes("429")) {
      return "أحييي! الردم كتر وقوقل قالت لي أهدي شوية، جرب بعد شوية.";
    }

    return "سجمي! المخ (API) علق شوية من كتر الردم، جرب تاني يا فرده.";
  }
};

module.exports = { generate };
