import { GoogleGenAI, Type } from "@google/genai";

function getAIInstance(customKey?: string) {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini APIキーが設定されていません。AIアシスタント機能を使用するには、画面内の『🔑 独自のGemini APIキーを使用する』からご自身の無料APIキーを登録するか、サーバーの環境変数 GEMINI_API_KEY を設定してください。");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export default async function handler(req: any, res: any) {
  // Handle CORS and preflight requests if needed, but since it's same-origin on Vercel it's simple
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { text, field, maxLength } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text is required and must be a string." });
      return;
    }

    const headerKey = req.headers["x-api-key"] || req.headers["X-API-Key"];
    const customKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;
    const ai = getAIInstance(customKey);
    const systemInstruction = `
あなたは、支援者の「パーソナルカード」に掲載するプロフィール文やメッセージを推敲・調整する優秀なAIアシスタントです。
利用者が入力した文章を、本人の言葉の特徴や意味、熱量を損なわずに、より読みやすく簡潔に整えてください。

【最重要指示】
1. 新しい事実や情報は絶対に追加しないでください。
2. 元の意味や意図を変えないでください。
3. 本人らしいユニークな表現や言葉づかいをできるだけ残してください（一般的な表現に丸めすぎないでください）。
4. 各案は、指示された最大文字数（${maxLength}文字）以内になるように、適切に文章を整えてください。
5. 異なるニュアンスやカット（構成）で、3つのバリエーション（案）を提示してください。
`;

    const prompt = `
推敲対象の項目: ${field}
最大文字数制限: ${maxLength}文字
元の文章:
"""
${text}
"""

この文章を、上記のルール（事実追加なし、意味不変、個性を残す、文字数制限厳守）に従い、3案作成してください。
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "3 highly polished and concise suggestions that strictly satisfy the rules.",
            },
          },
          required: ["suggestions"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    res.status(200).json({ suggestions: parsed.suggestions });
  } catch (error: any) {
    console.error("Vercel Serverless Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate suggestions." });
  }
}
