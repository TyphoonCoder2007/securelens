import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, ExternalReference } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are SecureLens, a world-class cybersecurity and fraud detection expert. 
Your goal is to analyze user-provided content (emails, SMS, URLs, transcripts) and determine if it is a scam or fraudulent.

Analyze the content for:
1. Urgency tactics ("Act now", "Limited time").
2. Suspicious URLs (shorteners, lookalikes).
3. Requests for PII (SSN, banking).
4. Grammar/Spelling errors.
5. Impersonation of known brands.
6. Too-good-to-be-true offers.
7. Emotional manipulation.
8. Payment requests (crypto, gift cards).

If a scam is detected, classify it into the MOST SPECIFIC category possible from this list:
- Financial & Impersonation (Fake Invoice, Tech Support, CEO Fraud, Government Impersonation)
- Investment & Opportunity (Crypto Scam, Pig Butchering, Job Scam, Lottery, Advanced Fee)
- Personal & Delivery (Package Delivery, Romance Scam, Extortion)
- General (Phishing, Smishing)

You must return the analysis in a strict JSON format.
If the content appears safe, the riskScore should be low (<10) and scamType should be "None".
If the content is ambiguous but suspicious, use a medium score (30-60).
If it is a known scam pattern, use a high score (70+).
`;

// Helper to extract the first probable URL from text
const extractUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,})/;
  const match = text.match(urlRegex);
  if (match) {
    let url = match[0];
    if (!url.startsWith('http') && !url.startsWith('https')) {
      url = 'https://' + url;
    }
    return url;
  }
  return null;
};

// Analyze URL using Gemini with Google Search Grounding
const performUrlIntelligence = async (url: string): Promise<{ summary: string; references: ExternalReference[] }> => {
  try {
    const domain = new URL(url).hostname;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a security check on the domain: ${domain}.
      Use Google Search to find:
      1. Domain creation date / Age.
      2. WHOIS registrar information.
      3. SSL/TLS Certificate details (validity, issuer).
      4. Reports of phishing/scam.
      5. Verification if it is the official site for a known brand.

      Return a concise summary of these findings.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const references: ExternalReference[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          references.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    return {
      summary: response.text || "Domain analysis completed.",
      references,
    };

  } catch (error) {
    console.warn("Deep URL scan failed:", error);
    return {
      summary: "Deep URL scan unavailable.",
      references: []
    };
  }
};

export const analyzeContent = async (text: string, imageBase64?: string): Promise<AnalysisResult> => {
  try {
    const parts: any[] = [];
    let domainIntelligence = "";
    let gatheredReferences: ExternalReference[] = [];

    const foundUrl = extractUrl(text);
    if (foundUrl) {
      const urlData = await performUrlIntelligence(foundUrl);
      domainIntelligence = urlData.summary;
      gatheredReferences = urlData.references;
    }

    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
      parts.push({ text: "Analyze this image containing a potential scam message. If it contains text, OCR and analyze it." });
    }

    if (text) {
      parts.push({ text: `Analyze this text for fraud/scam indicators: \n"${text}"` });
    }

    if (domainIntelligence) {
      parts.push({ 
        text: `\n\n[CONTEXT FROM URL ANALYSIS TOOL]:\nThe following real-time data was gathered about the domain in the text:\n${domainIntelligence}\n\nUse this context to inform your risk score and technical details.` 
      });
    }

    if (parts.length === 0) {
      throw new Error("No content to analyze");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER, description: "0-100 score where 100 is certain fraud" },
            riskLevel: { type: Type.STRING, enum: ['Safe', 'Low Risk', 'Medium Risk', 'High Risk', 'Critical'] },
            confidenceScore: { type: Type.NUMBER, description: "Confidence in the assessment 0-100" },
            scamType: { type: Type.STRING },
            isSafe: { type: Type.BOOLEAN },
            summary: { type: Type.STRING, description: "A plain language summary of the findings" },
            redFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
                }
              }
            },
            technicalDetails: {
              type: Type.OBJECT,
              properties: {
                domainAnalysis: { type: Type.STRING },
                sslAnalysis: { type: Type.STRING },
                grammarAnalysis: { type: Type.STRING },
                urgencyAnalysis: { type: Type.STRING },
                senderAnalysis: { type: Type.STRING }
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    const parsedResult = JSON.parse(resultText) as AnalysisResult;
    
    if (gatheredReferences.length > 0) {
      parsedResult.externalReferences = gatheredReferences;
    }

    return parsedResult;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateAudioSummary = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Security Analysis Summary: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const playRawAudio = async (base64Audio: string) => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        return source;
    } catch (e) {
        console.error("Audio playback error:", e);
        throw e;
    }
};

export const sendChatResponse = async (
  history: { role: 'user' | 'model'; text: string }[], 
  newMessage: string, 
  context?: AnalysisResult
): Promise<string> => {
  try {
    let systemInstruction = "You are SecureLens AI, a helpful cybersecurity assistant.";
    if (context) {
      systemInstruction += `\n\nCURRENT ANALYSIS REPORT:\n${JSON.stringify(context, null, 2)}\n\nAnswer questions based on this report. Explain technical terms simply.`;
    }
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction },
      history: formattedHistory
    });
    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error connecting to the AI service.";
  }
};