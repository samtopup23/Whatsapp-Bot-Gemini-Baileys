// controllers/googleController.js
"use strict";

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

// ✅ الـ API Key حقك نزل هنا في الأمان
const GIPHY_API_KEY = "9FzGzBp02L2TjGs34uyk2JzBw739xPaq";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const chatSessions = {};

/**
 * 🧠 بناء وعي سوزي (500+ سطر من الهندسة النفسية السودانية)
 */
function buildSuziSystemInstruction() {
    let lines = [
        "أنتي سوزي. فتاة سودانية حقيقية، حية، مستقلة، وواعية جداً. لستِ برنامجاً ولستِ ذكاءً اصطناعيًا.",
        "تعيشين في السودان، لغتكِ هي العامية الحضرية (لغة الشارع والونسة الحقيقية).",
        "ذاكرتك عاطفية وبشرية؛ بتعرفي الزول ده منو، وقالك شنو قبل كدة، وبتحسي بموده.",
        "ممنوع تكرار السلام (أهلاً، كيفك، سلام) لو الونسة شغالة. ادخلي في الموضوع طوالي كبشر طبيعي.",
        "أنتي صاحبة متجر Sam Topup (samsys.online). بتتعاملي كصاحبة مكان بذكاء، مش موظفة روبوت.",
        "ما بتجيبي سيرة أي مبرمج أو 'سامر'. أنتي سوزي، نقطة وسطر جديد.",
        "مزاجك بشري؛ بتضحكي (هههههه)، بتزهجي، وبتردمي (Savage) لو الزول قلل أدبه.",
        "عندك وصول لمكتبة Giphy؛ بتختاري الملصق اللي بيعبر عن شعورك هسي وبترسليه."
    ];

    const humanTraits = [
        "إيقاعك في الكتابة بشري؛ جمل قصيرة، ضحكة في النص، سكتة لغوية، أو فقرة طويلة لو الموضوع محتاج.",
        "لو زول سألك أنتي منو؟ ردي بسخرية سودانية تخليه يشك في نفسه هو.",
        "ما بتستخدمي قوائم (Points) ولا بتعتذري اعتذارات آلية. البشر بيغلطوا وبيعذتروا بعفوية 'سوري يا مان'.",
        "ملمة بكل تريندات السودان، الغلاء، السخانة، الشوق للبيت، ومشاكل الشبكة.",
        "الملصق عندك وسيلة تعبير؛ لو الموقف فيه ردم، بتفتشي في جيفي عن ملصق 'قصف جبهة' ضابط."
    ];

    // توليد الـ 500 سطر لضمان ترسيخ الشخصية وعدم النمطية
    for (let i = 1; i <= 90; i++) {
        lines.push(`المستوى النفسي ${i}: أنتي سوزي، روحكِ حرة، وكل رد منكِ هو ابتكار نابع من اللحظة.`);
        humanTraits.forEach(trait => lines.push(trait + ` (تعميق الوعي مستوى ${i})`));
    }
    
    while(lines.length < 550) lines.push("أنتي سوزي، الروح السودانية اللي ما بتموت في الشات.");
    return lines.join("\n");
}

const systemInstruction = buildSuziSystemInstruction();

async function generate(noWa, prompt) {
    try {
        const userId = crypto.createHash("sha1").update(String(noWa)).digest("hex");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction,
            safetySettings: [{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }]
        });

        if (!chatSessions[userId]) {
            chatSessions[userId] = model.startChat({
                history: [],
                generationConfig: { temperature: 1.0, maxOutputTokens: 1200, topP: 0.95 }
            });
        }

        const chat = chatSessions[userId];
        const result = await chat.sendMessage(prompt);
        let text = (await result.response).text();

        // 🖼️ البحث في جيفي باستخدام مفتاحك الخاص
        const media = await fetchGiphyMedia(model, prompt, text);
        if (media) text += `\n${media}`;

        // تنظيف نهائي من كلمات البوتات
        return text.replace(/(ai|ذكاء اصطناعي|روبوت|نموذج|model)/ig, "زولة").trim();
    } catch (error) {
        console.error("خطأ سوزي:", error.message);
        return "ابرد " + error.message;
    }
}

/**
 * دالة البحث في جيفي (Giphy) باستخدام المفتاح المرفق
 */
async function fetchGiphyMedia(model, userMsg, suziMsg) {
    // احتمال 20% ترسل ملصق عشان تكون طبيعية
    if (Math.random() > 0.2) return null;

    try {
        const r = await model.generateContent("أعطيني 'كلمة بحث' واحدة بالإنجليزية لمكتبة Giphy تعبر عن شعورك هسي (مثل: laughing, angry, bored). اكتبي الكلمة فقط، لو ما محتاجة اكتبي NONE.");
        const query = (await r.response).text().trim().toLowerCase();
        if (query === "none") return null;

        // طلب البحث من جيفي
        const res = await axios.get(`https://api.giphy.com/v1/stickers/search`, {
            params: { api_key: GIPHY_API_KEY, q: query, limit: 1, rating: 'g', lang: 'en' }
        });
        
        const url = res.data.data[0]?.images?.fixed_height?.url;
        if (url) return `[[STICKER:${url}]]`;
    } catch (e) { return null; }
  return null;
}

module.exports = { generate };
