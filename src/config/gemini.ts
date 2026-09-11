import { GoogleGenAI, Type } from '@google/genai';
import { env, isGeminiConfigured } from './env.js';

export { Type };

let genAIClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && isGeminiConfigured()) {
    genAIClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export const getGeminiModelName = (): string => {
  return env.GEMINI_MODEL || 'gemini-2.5-flash';
};
