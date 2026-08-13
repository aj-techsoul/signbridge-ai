import { GoogleGenAI } from '@google/genai';

export interface TranslationResult {
  text: string;
  confidence: number;
  explanation?: string;
}

export async function translateGestureImageWithGemini(
  base64Image: string,
  apiKey?: string
): Promise<TranslationResult> {
  const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!key) {
    throw new Error('Gemini API Key missing. Click the "Audio & AI Settings" button at the top to paste your key, or set NEXT_PUBLIC_GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey: key });

  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

  const prompt = `You are a world-class deaf interpreter and expert in American Sign Language (ASL), Indian Sign Language (ISL), and global sign languages.
Analyze this camera video frame showing sign language gestures.
Your task:
1. Translate the complete sign language sentence or gesture into natural, fluent English text.
2. If the user is forming multiple gestures, combine them into a meaningful full sentence (e.g. "I need water please", "Where is the nearest hospital?", "Hello, nice to meet you").
3. Assign a confidence rating between 0.0 and 1.0.

Respond strictly in pure JSON without markdown backticks:
{
  "text": "Full translated sentence",
  "confidence": 0.96,
  "explanation": "Brief explanation of hand movements and spatial posture observed."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
          ],
        },
      ],
    });

    const outputText = response.text ? response.text.trim() : '';
    const cleanJson = outputText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      text: parsed.text || 'Translated Sign Sentence',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.90,
      explanation: parsed.explanation || 'Analyzed via Gemini Multimodal Vision API.',
    };
  } catch (err: unknown) {
    console.error('Gemini API Deep Sentence Error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to translate sentence with Gemini API');
  }
}
