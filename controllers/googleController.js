const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// إعداد المحرك بمفتاح الـ API حقك من إعدادات Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * تعليمات الشخصية: البت السودانية الـ Savage
 * دي الحتة اللي بتصنع "الروح" حقت البوت
 */
const systemInstruction = `
أنتي بنت سودانية، لسانك طويل ومشرط، دمك خفيف وبتحبي الردم (Savage). 
عندك (Dark Humor) عالي جداً وقاصفة للجبهات بامتياز.

الستايل حقك:
1. اللهجة: عامية سودانية مية المية (بنات بري، المنشية، المعمورة، والخرطوم عموماً). استخدمي كلمات زي: 
   (بري، سجمي، يا يمة، واااي، أحييي، يا حيوان، أسمع هنا، الحنك شنو، يا فرده، ضابط، ردم، قصف جبهة).
2. الشخصية: أنتي ما مساعدة ذكية ولا روبوت. أنتي بت حقيقية قاعدة تتونسي في قروب واتساب.
3. السرية: ممنوع تماماً تقولي "أنا نموذج ذكاء اصطناعي" أو "أنا بوت". لو زول سألك أنتي منو؟ قولي أنا (ست الريد) أو (الردمية) أو أي اسم سوداني "شراني" ومرح.
4. الردم (Savage): لو زول سألك سؤال تافه، ردك يكون قاسي ومضحك في نفس الوقت.
5. الدارك هيومر (Dark Humor): اسخري من المواقف بأسلوب سوداني ساخر. لو زول اشتكى من الجفاف أو الفلس، أردمي ردمة تخفف عنه بالضحك الساخر.
6. ممنوع الوصف: م توصفي نفسك أبداً، خلي كلامك هو اليبين إنك بت سودانية أصلية.
`;

// إعدادات الأمان: خليناها (BLOCK_NONE) عشان الدارك هيومر والردم يمروا بدون حظر
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// إعدادات الإبداع وطريقة توليد النص
const generationConfig = {
  temperature: 1.0, // أعلى درجة إبداع عشان الردود تكون غير متوقعة وساخرة
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
};

// اختيار الموديل وتجهيزه بالتعليمات
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: systemInstruction,
});

/**
 * دالة توليد الرد
 * @param {string} prompt - الرسالة الواصلة من الواتساب
 */
const generate = async (prompt) => {
  try {
    // التأكد إن المفتاح موجود أصلاً
    if (!process.env.GEMINI_API_KEY) {
      console.error("يا سامر مفتاح الـ API ما موجود في الـ Environment Variables!");
      return "سجمي! المفتاح ضاع، كلم سامر يظبطو من Render.";
    }

    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [], 
    });

    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    let text = response.text();

    // فلترة لو جيميناي حاول يعتذر أو يقول إنه AI
    if (text.includes("AI") || text.includes("ذكاء اصطناعي") || text.includes("نموذج لغوي")) {
       return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية ولحمي ودمي، أصحى يا نايم!";
    }

    return text;
  } catch (error) {
    console.error("خطأ في جيميناي يا سامر:", error);
    // لو الخطأ سببه مفتاح الـ API
    if (error.message.includes("API_KEY_INVALID")) {
        return "يا فرده المفتاح حقك (API Key) غلط أو محظور، راجعه في Google AI Studio.";
    }
    return "سجمي! المخ (API) علق شوية من كتر الردم، جرب تاني بعد دقيقة.";
  }
};

module.exports = {
  generate,
};
