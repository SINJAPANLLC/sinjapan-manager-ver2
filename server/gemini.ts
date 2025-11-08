// Gemini AI Service - javascript_gemini integration
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithGemini(
  message: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // Build conversation contents
    const contents: any[] = [];
    
    if (conversationHistory && conversationHistory.length > 0) {
      // Add previous messages
      conversationHistory.forEach((msg) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      });
    }
    
    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: contents,
    });

    return response.text || "申し訳ありません。応答を生成できませんでした。";
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

export async function generateTextWithGemini(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini text generation error:", error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

export async function generateDocumentWithGemini(
  type: string,
  prompt: string,
  context?: string
): Promise<string> {
  try {
    let systemPrompt = "";
    
    switch (type) {
      case "report":
        systemPrompt = "あなたはプロフェッショナルなビジネスレポートライターです。詳細で構造化されたレポートを作成してください。";
        break;
      case "email":
        systemPrompt = "あなたはビジネスメールの専門家です。丁寧で効果的なビジネスメールを作成してください。";
        break;
      case "proposal":
        systemPrompt = "あなたは提案書作成の専門家です。説得力のある提案書を作成してください。";
        break;
      case "summary":
        systemPrompt = "あなたは要約の専門家です。重要なポイントを抽出し、簡潔にまとめてください。";
        break;
      default:
        systemPrompt = "あなたは優秀なビジネス文書作成の専門家です。";
    }

    const fullPrompt = context 
      ? `コンテキスト: ${context}\n\n要求: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini document generation error:", error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

export async function generateImageWithGemini(
  prompt: string
): Promise<{ imageData: string; mimeType: string } | null> {
  try {
    // Use Gemini's experimental image generation model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: `画像生成: ${prompt}` }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return null;
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return null;
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }

    return null;
  } catch (error: any) {
    console.error("Gemini image generation error:", error);
    // Gemini may not support image generation, fall back gracefully
    throw new Error("Gemini画像生成は現在利用できません。DALL-Eを使用してください。");
  }
}

export async function analyzeSentiment(text: string): Promise<{
  rating: number;
  confidence: number;
  summary: string;
}> {
  try {
    const systemPrompt = `あなたは感情分析の専門家です。
テキストの感情を分析し、1から5の評価（1=非常にネガティブ、5=非常にポジティブ）、
信頼度（0から1）、および簡単な要約を提供してください。
JSONフォーマットで応答してください: 
{'rating': number, 'confidence': number, 'summary': string}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            rating: { type: "number" },
            confidence: { type: "number" },
            summary: { type: "string" },
          },
          required: ["rating", "confidence", "summary"],
        },
      },
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    });

    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error: any) {
    console.error("Gemini sentiment analysis error:", error);
    throw new Error(`Failed to analyze sentiment: ${error.message}`);
  }
}

export async function summarizeText(text: string): Promise<string> {
  try {
    const prompt = `以下のテキストを簡潔に要約してください。重要なポイントを維持しながら、わかりやすくまとめてください：\n\n${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    return response.text || "要約を生成できませんでした。";
  } catch (error: any) {
    console.error("Gemini summarization error:", error);
    throw new Error(`Failed to summarize: ${error.message}`);
  }
}

// Task Generation
export async function generateTaskSuggestions(context: string): Promise<Array<{
  title: string;
  description: string;
  priority: string;
  quadrant: string;
}>> {
  try {
    const systemPrompt = `あなたはタスク管理の専門家です。
与えられたコンテキストから、具体的で実行可能なタスクを3-5個提案してください。
各タスクには以下を含めてください：
- title: タスク名（簡潔に）
- description: 詳細な説明
- priority: 優先度（high/medium/low）
- quadrant: カテゴリ（sales/organization/risk/expansion）

JSONフォーマットで応答してください。`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  quadrant: { type: "string" },
                },
                required: ["title", "description", "priority", "quadrant"],
              },
            },
          },
          required: ["tasks"],
        },
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `コンテキスト: ${context}` }],
        },
      ],
    });

    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data.tasks || [];
    }
    return [];
  } catch (error: any) {
    console.error("Gemini task generation error:", error);
    throw new Error(`Failed to generate tasks: ${error.message}`);
  }
}

// SNS Post Generation
export async function generateSocialPost(params: {
  platform: string;
  topic: string;
  tone?: string;
  hashtags?: number;
}): Promise<{ content: string; hashtags: string[] }> {
  try {
    const { platform, topic, tone = "professional", hashtags = 3 } = params;
    
    const systemPrompt = `あなたはSNSマーケティングの専門家です。
プラットフォーム: ${platform}
トーン: ${tone}
ハッシュタグ数: ${hashtags}

魅力的で効果的なSNS投稿を作成してください。
JSONフォーマットで応答してください。`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            content: { type: "string" },
            hashtags: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["content", "hashtags"],
        },
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `トピック: ${topic}` }],
        },
      ],
    });

    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    }
    return { content: "", hashtags: [] };
  } catch (error: any) {
    console.error("Gemini social post generation error:", error);
    throw new Error(`Failed to generate social post: ${error.message}`);
  }
}

// CRM Customer Analysis
export async function analyzeCustomer(customerData: {
  name: string;
  interactions: number;
  lastContact?: string;
  notes?: string;
}): Promise<{
  insights: string;
  recommendations: string[];
  nextActions: string[];
}> {
  try {
    const systemPrompt = `あなたはCRM分析の専門家です。
顧客データを分析し、洞察と推奨事項を提供してください。
JSONフォーマットで応答してください。`;

    const customerInfo = `
顧客名: ${customerData.name}
インタラクション数: ${customerData.interactions}
最終接触日: ${customerData.lastContact || "不明"}
メモ: ${customerData.notes || "なし"}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            insights: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" },
            },
            nextActions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["insights", "recommendations", "nextActions"],
        },
      },
      contents: [
        {
          role: "user",
          parts: [{ text: customerInfo }],
        },
      ],
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    }
    return { insights: "", recommendations: [], nextActions: [] };
  } catch (error: any) {
    console.error("Gemini customer analysis error:", error);
    throw new Error(`Failed to analyze customer: ${error.message}`);
  }
}

// Financial Report Generation
export async function generateFinancialReport(data: {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  context?: string;
}): Promise<string> {
  try {
    const systemPrompt = `あなたは財務分析の専門家です。
与えられた財務データから、包括的で洞察に富んだレポートを作成してください。
トレンド分析、リスク評価、改善提案を含めてください。`;

    const financialData = `
期間: ${data.period}
売上: ¥${data.revenue.toLocaleString()}
経費: ¥${data.expenses.toLocaleString()}
利益: ¥${data.profit.toLocaleString()}
利益率: ${((data.profit / data.revenue) * 100).toFixed(2)}%
${data.context ? `\n追加情報: ${data.context}` : ""}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: financialData }],
        },
      ],
    });

    return response.text || "財務レポートを生成できませんでした。";
  } catch (error: any) {
    console.error("Gemini financial report error:", error);
    throw new Error(`Failed to generate financial report: ${error.message}`);
  }
}
