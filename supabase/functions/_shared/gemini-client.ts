
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3';
import { AppError } from './error-handler.ts';

const SYSTEM_PROMPT = `あなたは飲食店の業務マニュアル作成の専門家です。
与えられた動画から、新人スタッフが理解しやすい業務マニュアルを作成してください。

出力は以下のJSON形式に厳密に従ってください:
{
  "summary": "3行以内の要約",
  "steps": [
    { "step_number": 1, "description": "具体的な手順", "tips": "注意点やコツ" }
  ],
  "tips": [
    "全体を通しての重要なポイント"
  ],
  "category": "ホール" | "キッチン" | "清掃" | "安全衛生" | "その他"
}`;

export interface AiManualResult {
  summary: string;
  steps: Array<{ step_number: number; description: string; tips: string }>;
  tips: string[];
  category: string;
}

export async function callGemini(videoUrl: string, language: string): Promise<AiManualResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new AppError('CONFIG_ERROR', 'GEMINI_API_KEY is not set', 500);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-pro' });

  const userPrompt = `以下の動画を分析し、業務マニュアルを作成してください。

動画URL: ${videoUrl}
出力言語: ${language}

要件:
- summaryは3行以内で、業務の目的と全体像を簡潔に説明
- stepsは時系列順に、具体的な行動を記載（5-10ステップ程度）
- 各ステップには「なぜこの手順が必要か」を含める
- tipsには安全上の注意点や効率化のコツを記載
- 多言語対応: ${language} で出力してください`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] }],
      // Note: responseMimeType is not supported in the current SDK; prompt enforces JSON instead.
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as AiManualResult;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new AppError('AI_PROCESSING_ERROR', 'Failed to process with Gemini', 500, true);
  }
}
