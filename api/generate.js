import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY missing. Please add GEMINI_API_KEY to your Vercel Project Settings -> Environment Variables.' 
    });
  }

  const { topic = 'Random Practical Everyday Malaysian Words', existingWords = [] } = req.body || {};
  const normalizedExisting = new Set(existingWords.map(w => w.toLowerCase().trim()));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const exclusionPrompt = normalizedExisting.size > 0 
      ? `\nCRITICAL DUPLICATION RULE: Do NOT generate any of the following Malay words/phrases under any circumstance: ${JSON.stringify(Array.from(normalizedExisting))}. Ensure all 10 words are completely distinct from this list.`
      : '';
    const prompt = `Generate exactly 10 practical, commonly used Malay words or short daily phrases for conversational fluency in Malaysia. Theme or Focus: "${topic}".${exclusionPrompt}
CRITICAL GRAMMAR REQUIREMENT: Ensure at least 3 of the 10 generated words showcase classic Malaysian reduplication (Kata Ganda - such as Kata Ganda Penuh [e.g. anak-anak], Kata Ganda Separa [e.g. jejari, lelangit], or Kata Ganda Berentak [e.g. kuih-muih, gotong-royong]).
CRITICAL PURITY FILTER: Do NOT include English loan words or obvious cognates (such as boss/bos, meeting/miting, OT/overtime, fail/file, e-mel/email, bank, teksi, ekon). Only generate authentic Malaysian vocabulary where the Malay word is distinct from English.
Return ONLY a valid raw JSON array of objects. Do not include markdown formatting or backticks. 
Each object MUST match this schema:
{"id": number, "category": string, "malay": string, "english": string, "pronunciation": string}
Ensure category is concise (e.g. 'AI: Kata Ganda' or 'AI: Everyday') and pronunciation is an easy English phonetic guide.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let rawText = response.text || '';
    const firstBracket = rawText.indexOf('[');
    const lastBracket = rawText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      rawText = rawText.slice(firstBracket, lastBracket + 1);
    } else {
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    const parsedWords = JSON.parse(rawText);

    if (!Array.isArray(parsedWords) || parsedWords.length === 0) {
      throw new Error("AI returned invalid array structure.");
    }

    // Filter duplicates locally in the API response as a safety measure
    const uniqueParsed = parsedWords.filter(w => {
      if (!w.malay) return false;
      const val = w.malay.toLowerCase().trim();
      if (normalizedExisting.has(val)) {
        return false;
      }
      normalizedExisting.add(val);
      return true;
    });

    const words = uniqueParsed.map((w, idx) => ({
      ...w,
      id: Date.now() + idx,
      isAI: true
    }));

    return res.status(200).json({ words });
  } catch (error) {
    console.error("Vercel Serverless AI Proxy Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Failed generating words via Vercel server proxy.' 
    });
  }
}
