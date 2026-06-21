import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing in Vercel environment variables.' });
  }

  const { sentence = '' } = req.body || {};
  if (!sentence.trim()) {
    return res.status(400).json({ error: 'Sentence required.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Act as an encouraging, expert KL Bahasa Melayu language coach. Analyze this practice sentence typed by a student: "${sentence}".
Return ONLY raw valid JSON matching this exact schema:
{
  "rating": number (1 to 10 scale of conversational naturalness),
  "isCorrect": boolean,
  "feedback": "Concise 1 or 2 sentence explanation of grammar or tone",
  "nativeBetter": "The exact natural way a native KL resident would say this"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let rawText = response.text || '';
    const firstB = rawText.indexOf('{');
    const lastB = rawText.lastIndexOf('}');
    if (firstB !== -1 && lastB !== -1) {
      rawText = rawText.slice(firstB, lastB + 1);
    } else {
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    const doctorResult = JSON.parse(rawText);
    return res.status(200).json(doctorResult);
  } catch (error) {
    console.error("Sentence Doctor API Error:", error);
    return res.status(500).json({ error: error.message || 'Failed checking sentence.' });
  }
}
