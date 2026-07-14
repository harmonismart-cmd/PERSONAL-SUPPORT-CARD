import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

let aiClient: any = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for AI assistant
app.post("/api/gemini/suggest", async (req, res) => {
  try {
    const { text, field, maxLength } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text is required and must be a string." });
      return;
    }

    const ai = getAI();
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
                type: Type.STRING
              },
              description: "3 highly polished and concise suggestions that strictly satisfy the rules."
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    res.json({ suggestions: parsed.suggestions });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate suggestions." });
  }
});

// Serve static assets in production, or mount Vite dev server in development
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
