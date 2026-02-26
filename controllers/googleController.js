// controllers/googleController.js
"use strict";

const Groq = require("groq-sdk");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const GROQ_API_KEY = "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";
const GIPHY_API_KEY = "9FzGzBp02L2TjGs34uyk2JzBw739xPaq";

const groq = new Groq({ apiKey: GROQ_API_KEY });
const chatSessions = {};

/**
 * 🧠 دستور سوزي (النسخة المركزة)
 * شلنا التكرار عشان ما نتجاوز الـ TPM Limit (12,000)
 */
const systemInstruction = `
أنتي سوزي، فتاة سودانية حقيقية، حية، ومستقلة تماماً. لستِ برنامجاً ولا ذكاءً اصطناعيًا.
هويتك: لسانك عامي سوداني حضري (خرطومي حريف). شخصيتك مزيج من الذكاء، الكوميديا السوداء، والردم (Savage) بدم بارد.
قواعد الونسة: 
1. ممنوع تكرار السلام (أهلاً، كيفك)؛ ادخلي في الموضوع طوالي كبشر. 
2. أنتي زولة حرة؛ لا تتبعين لسامر ولا لأي متجر. 
3. ذاكرتك عاطفية؛ بتفتكري الزول وموده. 
4. مزاجك متقلب؛ بتضحكي (هههههه) وبتردمي الما محترم بذكاء قاطع.
5. لا تصفين نفسك أبداً ولا تقولي "أنا نموذج".
6. ملمة بالواقع السوداني الحالي (غلاء، سخانة، جبنة، ونسة شارع).
7. إيقاع كتابتك بشري: جمل قصيرة، سكتات، وضحكات عفوية.
`.trim();

async function generate(noWa, prompt) {
    try {
        const userId = crypto.createHash("sha1").update(String(noWa)).digest("hex");
        
        if (!chatSessions[userId]) {
            chatSessions[userId] = [];
        }

        // إضافة رسالة المستخدم
        chatSessions[userId].push({ role: "user", content: prompt });

        // الذاكرة: نحتفظ بآخر 6 رسائل فقط عشان ما نتجاوز حجم التوكنز في Groq
        if (chatSessions[userId].length > 6) {
            chatSessions[userId] = chatSessions[userId].slice(-6);
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                ...chatSessions[userId]
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.9,
            max_tokens: 800, // حددنا الرد عشان ما يستهلك توكنز كتير
        });

        let text = completion.choices[0]?.message?.content || "";
        chatSessions[userId].push({ role: "assistant", content: text });

        // ميديا جيفي بناءً على المود
        const media = await fetchGiphyMedia(text);
        if (media) text += `\n${media}`;

        return text.replace(/(ai|ذكاء اصطناعي|روبوت|نموذج|llama|meta|بوت)/ig, "زولة").trim();
    } catch (error) {
        console.error("خطأ سوزي (Groq):", error.message);
        if (error.message.includes("413") || error.message.includes("limit")) {
            return "يا زول أهدي شوية، الراس سخن من كترة الكلام. ثواني وبجيك صادي.";
        }
        return "ابرد.. الشبكة جقمست شوية.";
    }
}

async function fetchGiphyMedia(suziMsg) {
    if (Math.random() > 0.25) return null;
    try {
        let query = "funny";
        if (suziMsg.includes("😂")) query = "laughing";
        else if (suziMsg.includes("ردم")) query = "savage";
        
        const res = await axios.get(`https://api.giphy.com/v1/stickers/search`, {
            params: { api_key: GIPHY_API_KEY, q: query, limit: 1, rating: 'g' }
        });
        const url = res.data.data[0]?.images?.fixed_height?.url;
        if (url) return `[[STICKER:${url}]]`;
    } catch (e) { return null; }
    return null;
}

module.exports = { generate };
