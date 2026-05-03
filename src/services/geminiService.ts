import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateArchiveInsights(content: string) {
  if (!ai) return "AI Insights unavailable (Missing API Key)";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this content and provide a summary, 3 key themes, and suggested tags. Output in clean text. \n\n Content: ${content}`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insights.";
  }
}
