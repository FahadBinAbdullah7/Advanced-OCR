
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { QACFix, DetectedImage } from '../types';

const OCR_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

// Use the platform's standard environment variable for the API key.
const API_KEY = process.env.API_KEY;

export async function performAdvancedOCR(imageBase64: string, onProgress: (progress: number, status: string) => void) {
    onProgress(10, "Initializing AI-powered text extraction...");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    onProgress(30, "Connecting to Google Gemini AI for OCR...");
    
    // Step 1: Perform OCR
    const ocrPrompt = `You are an expert OCR system. Extract ALL visible text from this image with maximum accuracy.

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of text visible in the image, no matter how small.
2. Maintain exact formatting, spacing, and line breaks as they appear.
3. Support multiple languages, including but not limited to English and Bengali/Bangla.
4. Identify mathematical equations, formulas, symbols, and special characters.
5. **Vector Notation**: Recognize vector arrows above characters. Represent them by placing a combining overline character (U+0305) over EACH character in the vector.
6. Pay special attention to small text, footnotes, and captions.
7. Preserve table structures and bullet points if present.

Your response MUST be in this exact format:
TEXT: [all extracted text here]
---
CONFIDENCE: [your confidence percentage from 0-100 as an integer]`;
    
    const ocrResponse = await ai.models.generateContent({
        model: OCR_MODEL,
        contents: { parts: [{ inlineData: { data: imageBase64, mimeType: 'image/png'}}, { text: ocrPrompt }] },
        config: { temperature: 0.1, maxOutputTokens: 4096 }
    });
    const ocrRaw = ocrResponse.text;
    onProgress(60, "Processing OCR response...");

    const textMatch = ocrRaw.match(/TEXT:([\s\S]*?)---/);
    const confidenceMatch = ocrRaw.match(/CONFIDENCE: (\d+)/);
    const text = textMatch ? textMatch[1].trim() : ocrRaw.trim();
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 90;

    // Step 2: Detect Images
    onProgress(85, "Detecting non-text images...");
    const detectedImages = await detectImages(imageBase64);
    
    onProgress(100, "Extraction and detection complete!");

    return { text, confidence, detectedImages };
}

async function detectImages(imageBase64: string): Promise<DetectedImage[]> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const imagePrompt = `Analyze this image and identify ONLY non-text visual elements (photographs, diagrams, charts, etc.). EXCLUDE plain text, headings, and tables. For each visual element found, provide its bounding box coordinates as percentages from the top-left corner.

Respond in this exact format:
VISUAL_ELEMENTS_FOUND: [number]
COORDINATES: [one per line: "x_percent,y_percent,width_percent,height_percent,description", or "None"]`;

    const response = await ai.models.generateContent({
        model: OCR_MODEL,
        contents: { parts: [{ inlineData: { data: imageBase64, mimeType: 'image/png'}}, { text: imagePrompt }] }
    });

    const aiResponse = response.text;
    const images: DetectedImage[] = [];

    const coordinatesMatch = aiResponse.match(/COORDINATES:\s*([\s\S]*?)$/i);
    if (coordinatesMatch) {
        const lines = coordinatesMatch[1].trim().split('\n').filter(line => line.trim() && line.trim().toLowerCase() !== 'none');
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 5) {
                const [x, y, width, height] = parts.slice(0, 4).map(p => parseFloat(p.trim()));
                const description = parts.slice(4).join(',').trim();
                if (![x, y, width, height].some(isNaN) && width > 5 && height > 5) {
                    images.push({ id: `img_${Date.now()}_${Math.random()}`, x, y, width, height, description, base64: '', colorize: false });
                }
            }
        }
    }
    return images;
}


export async function performQAC(originalText: string, imageBase64: string): Promise<{ correctedText: string, fixes: QACFix[] }> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = `You are an expert text and mathematical expression correction specialist. Analyze the following OCR-extracted text, using the provided image as the absolute source of truth.

**CRITICAL INSTRUCTIONS FOR TEXT CORRECTION:**
1. Fix spelling, grammar, and character recognition errors.
2. Ensure formatting (spacing, line breaks) perfectly matches the image.

**CRITICAL INSTRUCTIONS FOR MATHEMATICAL EXPRESSIONS:**
3. Format ALL mathematical expressions for MS Word/Google Docs compatibility using proper Unicode symbols.
   - Superscripts: x², x³
   - Subscripts: H₂O, x₁
   - Fractions: ½, ¾, or a/b
   - Symbols: ∫, ∑, √, π, α, β, θ, ±, ≤, ≥, ∞, →
   - Vectors: Place a combining overline (U+0305) over EACH character.

Original Text to Correct:
---
${originalText}
---

Respond in this exact format:
CORRECTED_TEXT: [the fully corrected text with properly formatted math]
---
FIXES: [list each fix in format: "ORIGINAL|CORRECTED|TYPE|DESCRIPTION" one per line, or "None"]`;

    const response = await ai.models.generateContent({
        model: OCR_MODEL,
        contents: { parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType: 'image/png' }}] },
        config: { temperature: 0.1, maxOutputTokens: 8192 }
    });
    
    const aiResponse = response.text;
    const correctedTextMatch = aiResponse.match(/CORRECTED_TEXT:([\s\S]*?)---/);
    const fixesMatch = aiResponse.match(/FIXES:([\s\S]*)/);

    const correctedText = correctedTextMatch ? correctedTextMatch[1].trim() : aiResponse.trim();
    const fixes: QACFix[] = [];

    if (fixesMatch) {
        const fixLines = fixesMatch[1].trim().split('\n').filter(line => line.trim() && line.trim().toLowerCase() !== 'none');
        for (const line of fixLines) {
            const parts = line.split('|');
            if (parts.length >= 4) {
                fixes.push({
                    original: parts[0].trim(),
                    corrected: parts[1].trim(),
                    type: parts[2].trim(),
                    description: parts[3].trim(),
                });
            }
        }
    }
    
    return { correctedText, fixes };
}

export async function enhanceAndRedrawImage(imageBase64: string, colorize: boolean): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `Enhance this image with better lighting, clarity, and sharpness. ${colorize ? 'Also, colorize it realistically.' : ''} Return only the image.`;

    const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType: 'image/png' }}] },
        config: { responseModalities: [Modality.IMAGE] }
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePart?.inlineData) {
        const base64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;
        return `data:${mimeType};base64,${base64}`;
    }

    throw new Error("Image enhancement failed to return an image.");
}
