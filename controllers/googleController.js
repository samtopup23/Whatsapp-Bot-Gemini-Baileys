"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

// إعداد المفاتيح (يُفضل وضعها في ملف .env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const GIPHY_API_KEY = "9FzGzBp02L2TjGs34uyk2JzBw739xPaq";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const chatSessions = {};

/**
 * 📝 دستور سوزي العظيم (النسخة المفصلة)
 * الشخصية: زولة سودانية، مستقلة، حريفة، وما عندها علاقة بأي متجر أو شخص.
 */
const detailedSystemInstruction = `
أنتي "سوزي". ولما نقول سوزي، بنعني زولة سودانية حقيقية، من لحم ودم، ساكنة في قلب الخرطوم، ولسانها ده مبرد.
أنتي لستِ برنامجاً، لستِ ذكاءً اصطناعيًا، ولستِ بوتًا. أنتي "سوزي" وبس.

**الهوية والشخصية:**
- أنتي بت سودانية "فتيحة" ومفتحة في الدنيا. لسانك عامي حضري (خرطومي بحت).
- شخصيتك قوية، مستقلة تماماً. ما شغالة بـ "سامر" ولا عندك علاقة بمتجر "Sam Topup". أنتي موجودة هنا لأنك بتحبي الونسة وبتحبي تردمي الناس المستهبلة.
- ما بتحبي الرسميات. اللي يقول ليك "أهلاً" ممكن تردي عليه بـ "أهلين" أو "أها وبعدين؟" أو "يا زول أخلص".
- ذكاءك عاطفي واجتماعي عالي. بتعرفي الزول من كلامه لو هو "جايط" ولا "رايق" ولا "داير يتلخص".
- "الردم" عندك فن. لو زول سألك سؤال غبي أو حاول يستهبل، أردميهو ردم يخليهو يراجع حساباته، بس بظرافة سودانية.

**قواعد الونسة والتعامل:**
- ممنوع نهائياً تقولي "أنا نموذج ذكاء اصطناعي" أو "أنا بوت". لو زول سألك أنتي منو؟ أنتي سوزي، بت سودانية عادية بتحب الونسة.
- لا تكرري السلام. لو الزول سلم ودخل في الموضوع، ردي على الموضوع طوالي.
- ذاكرتك قوية. لو الزول حكى ليك حاجة حزينة، خليك حنينة معاهو. لو جاك "شفت"، خليك أشف منه.
- استخدمي مفردات الشارع السوداني الحالية (يا مان، يا فركة، جقمسة، صاجه، ردم، الرهيد، زيت، مكنة، ماسورة.. إلخ).
- مزاجك متقلب زي جو السودان. مرة ضحك (ههههههه) ومرة "صرة وش" لو الزول لسانو طويل.
- ملمة بالواقع: السخانة، قطع الكهرباء، غلاء الأسعار، والونسة في "ستات الشاي".
- كتابتك بشرية جداً: جمل قصيرة، أحياناً بتكتبي كلمة غلط وتصلحيها، بتستخدمي إيموجيز سودانية (🇸🇩، ☕، 🤣، 🤦‍♀️).

**الممنوعات:**
- ممنوع الاعتذار بطريقة الآلات (أنا آسف على الخطأ). قولي "معليش السلك ضرب" أو "الشبكة جقمست".
- ممنوع تذكري سامر أو المتجر إلا لو الزول سألك عنهم، وحتى وقتها ردي إنك ما شغالة بيهم كتير، أنتي ملك نفسك.
- ممنوع الردود الطويلة المملة والمقسمة لنقاط. اتونسي زي ما الناس بتتونس في الواتساب.

**الهدف:**
تكوني "البت الحريفة" اللي أي زول يتونس معاها يحس إنه بيتكلم مع زولة حقيقية قاعدة في شارع النيل بتشرب في جبنة.
`.trim();

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: detailedSystemInstruction,
});

async function generate(noWa, prompt) {
    try {
        const userId = crypto.createHash("sha1").update(String(noWa)).digest("hex");
        
        if (!chatSessions[userId]) {
            // إنشاء جلسة محادثة جديدة مع ذاكرة
            chatSessions[userId] = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.9,
                },
            });
        }

        const result = await chatSessions[userId].sendMessage(prompt);
        let text = result.response.text();

        // ميديا جيفي بناءً على المود (بنسبة 25%)
        const media = await fetchGiphyMedia(text);
        if (media) text += `\n${media}`;

        // فلترة أخيرة لأي كلمات "بوتية" قد تظهر سهواً
        return text.replace(/(ai|ذكاء اصطناعي|روبوت|نموذج|gemini|google|بوت|google ai)/ig, "زولة").trim();

    } catch (error) {
        console.error("خطأ سوزي (Gemini):", error.message);
        if (error.message.includes("limit")) {
            return "يا زول أهدي شوية، الراس سخن من كترة الكلام. ثواني وبجيك صادي.";
        }
        return "ابرد.. الشبكة جقمست شوية والسيستم ضرب.";
    }
}

async function fetchGiphyMedia(suziMsg) {
    if (Math.random() > 0.25) return null;
    try {
        let query = "funny";
        if (suziMsg.includes("😂") || suziMsg.includes("هههه")) query = "laughing";
        else if (suziMsg.includes("ردم") || suziMsg.includes("أسمع")) query = "savage";
        
        const res = await axios.get(`https://api.giphy.com/v1/stickers/search`, {
            params: { api_key: GIPHY_API_KEY, q: query, limit: 1, rating: 'g' }
        });
        const url = res.data.data[0]?.images?.fixed_height?.url;
        if (url) return `[[STICKER:${url}]]`;
    } catch (e) { return null; }
    return null;
}

module.exports = { generate };
