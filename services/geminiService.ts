import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RiskLevel, ScanType, FileMetadata } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing via process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

// Analysis prompt generation
const createAnalysisPrompt = (type: ScanType, content: string | FileMetadata) => {
  let contentDescription = "";

  if (type === ScanType.URL) {
    contentDescription = `URL to analyze: "${content}"`;
  } else if (type === ScanType.TEXT) {
    contentDescription = `Email/SMS Text content to analyze: "${content}"`;
  } else if (type === ScanType.FILE) {
    const meta = content as FileMetadata;
    contentDescription = `File Metadata: Name="${meta.name}", Type="${meta.type}", Size="${meta.size} bytes".`;
  }

  return `
    You are PhishGuard, a world-class cybersecurity AI. 
    Analyze the following ${type} for potential phishing, malware, or scam threats.
    
    ${contentDescription}

    Provide a strict JSON response.
    - riskScore: 0 (Safe) to 100 (Extremely Dangerous).
    - riskLevel: "SAFE", "SUSPICIOUS", or "MALICIOUS".
    - summary: A short 1-sentence explanation.
    - redFlags: An array of strings listing specific suspicious elements (e.g. "Urgency", "Typosquatting").
    - recommendation: Actionable advice (e.g. "Delete immediately", "Proceed with caution").
  `;
};

export const analyzeContent = async (
  type: ScanType,
  content: string | FileMetadata
): Promise<AnalysisResult> => {
  const ai = getClient();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createAnalysisPrompt(type, content),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: [RiskLevel.SAFE, RiskLevel.SUSPICIOUS, RiskLevel.MALICIOUS] },
            summary: { type: Type.STRING },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING },
          },
          required: ["riskScore", "riskLevel", "summary", "redFlags", "recommendation"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed", error);
    // Fallback error result
    return {
      riskScore: 0,
      riskLevel: RiskLevel.SUSPICIOUS,
      summary: "Analysis failed due to API error. Treat with caution.",
      redFlags: ["System Error"],
      recommendation: "Do not interact until verified.",
    };
  }
};

export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  const ai = getClient();
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: "You are PhishGuard Assistant. You help users understand security threats. Be concise, professional, and helpful. Explain technical terms simply.",
    },
    history: history,
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "I couldn't generate a response.";
};