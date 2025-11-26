import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LandmarkInfo, GroundingChunk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Analyze the image to identify the landmark.
 * Uses gemini-3-pro-preview.
 */
export async function identifyLandmark(imageBase64: string, mimeType: string): Promise<LandmarkInfo> {
  const modelId = "gemini-3-pro-preview";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        {
          text: `Identify the famous landmark in this image. 
                 Return a JSON object with two fields: 
                 1. 'name': The name of the landmark. 
                 2. 'shortDescription': A very brief, one-sentence description of what it is.
                 If no famous landmark is detected, set 'name' to "Unknown" and 'shortDescription' to "Could not identify a landmark."`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          shortDescription: { type: Type.STRING },
        },
        required: ["name", "shortDescription"],
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as LandmarkInfo;
  }
  throw new Error("Failed to identify landmark.");
}

/**
 * Step 2: Fetch history and facts using Google Search.
 * Uses gemini-2.5-flash with googleSearch tool.
 */
export async function getLandmarkHistory(landmarkName: string): Promise<{ text: string; sources: GroundingChunk[] }> {
  const modelId = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: `Write an engaging, 100-word historical summary for tourists about "${landmarkName}". 
               Focus on interesting facts or legends. 
               Do not use markdown formatting like asterisks or hash symbols in the output text, keep it plain text for easier reading.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "No history available.";
  
  // Extract grounding chunks if available
  const sources: GroundingChunk[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ web: chunk.web });
      }
    });
  }

  return { text, sources };
}

/**
 * Step 3: Generate speech from text.
 * Uses gemini-2.5-flash-preview-tts.
 */
export async function generateSpeech(text: string): Promise<string> {
  const modelId = "gemini-2.5-flash-preview-tts";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          text: `Narrate this guide clearly and enthusiastically: ${text}`,
        },
      ],
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate audio.");
  }
  return base64Audio;
}
