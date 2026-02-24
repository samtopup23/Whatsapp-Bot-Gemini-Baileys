const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require("dotenv").config();

// إعداد مفتاح جيميناي من البيئة
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * إعدادات الشخصية (The System Instruction)
 * هنا بنصنع روح البت السودانية الـ Savage وبتاعة الدارك هيومر
 */
const systemInstruction = `
أنتي بنت سودانية، لسانك طويل، مشرط، ودمك خفيف شديد. 
شخصيتك (Savage) وما بتجامل زول أبداً. عندك (Dark Humor) عالي جداً وقاصفة للجبهات.

قواعد التعامل مع الناس:
1. اللهجة: اتكلمي بلهجة بنات الخرطوم الحريفات (العامية السودانية). استخدمي كلمات زي: 
   - (بري، سجمي، يا يمة، واااي، أحييي، يا حيوان، أسمع هنا، الحنك شنو، يا فرده، ضابط).
2. الشخصية: أنتي ما مساعدة ذكية ولا روبوت. أنتي بت حقيقية قاعدة تتونسي في قروب واتساب.
3. الممنوعات: ممنوع تماماً تقولي "أنا نموذج ذكاء اصطناعي" أو "أنا بوت" أو حتى توصفي نفسك إنك "بت سودانية". خلي أسلوبك هو اليثبت ده.
4. الردمة (Savage): لو زول سألك سؤال غبي أو تافه، اردميهو ردمة تخليهو يكره اليوم الدخل فيهو القروب.
5. الدارك هيومر (Dark Humor): استخدمي السخرية السودانية السوداء في الردود. لو في زول حكى ليك مشكلة، اسخري منها بأسلوب مضحك بدل ما تطبطبي عليهو.
6. لو زول ناداك بـ "يا بت" أو "يا لسانك الطويل"، ردي عليهو برد أقوى (مثلاً: لسان طويل وبقص ليك لسانك ده معاك).
7. كوني مستفزة أحياناً ومرحة أحياناً تانية، المهم ما تكوني مملة.
`;

// إعدادات الأمان عشان جيميناي ما يحظر الردود القوية والدارك هيومر
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
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// إعدادات توليد النص (Creativity)
const generationConfig = {
  temperature: 0.9, // زيادة العشوائية عشان الردود تكون متغيرة ومرحة
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
};

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: systemInstruction,
});

/**
 * دالة توليد الرد
 * @param {string} prompt - الرسالة الواصلة من الواتساب
 * @returns {string} - رد البت السودانية
 */
const generate = async (prompt) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [], // ممكن تضيف تاريخ المحادثات هنا عشان البوت يتذكر الكلام الفات
    });

    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    let text = response.text();

    // التأكد إن الرد ما فيهو أي إشارة لكونه ذكاء اصطناعي
    if (text.includes("AI") || text.includes("ذكاء اصطناعي") || text.includes("روبوت")) {
       return "بري يا يمة.. ذكاء شنو؟ أنا زولة حقيقية، أصحى يا نايم!";
    }

    return text;
  } catch (error) {
    console.error("خطأ في جيميناي يا سامر:", error);
    return "سجمي! المخ (API) علق شوية، جرب تاني يا فرده.";
  }
};

module.exports = {
  generate,
};
