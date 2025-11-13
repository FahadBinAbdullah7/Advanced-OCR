

import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { QACFix } from '../types';

const OCR_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

// A utility function to clean potential markdown from AI responses
function cleanJsonString(rawString: string): string {
    if (!rawString) return "";
    // Remove markdown code block fences and "json" language identifier
    return rawString.trim().replace(/^```json\s*/, '').replace(/```$/, '').trim();
}


// A generic retry function to handle temporary API overload
async function withRetry<T>(
    requestFn: () => Promise<T>,
    onRetryStatus?: (status: string) => void
): Promise<T> {
    let lastError: any;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error: any) {
            lastError = error;
            const errorMessage = (error.message || error.toString()).toLowerCase();
            
            if (errorMessage.includes('503') || errorMessage.includes('unavailable') || errorMessage.includes('overloaded')) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                const retryMessage = `Model is busy. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${i + 1}/${maxRetries})`;
                console.warn(retryMessage);
                if(onRetryStatus) onRetryStatus(retryMessage);
                await new Promise(res => setTimeout(res, delay));
            } else {
                // Not a retryable error
                throw new Error(`The AI returned an error: ${error.message}`);
            }
        }
    }
    throw new Error(`The AI service is still busy after multiple attempts. Please try again later. Last error: ${lastError.message}`);
}

export async function performAdvancedOCR(apiKey: string, imageBase64: string, onProgress: (progress: number, status: string) => void) {
    const ai = new GoogleGenAI({ apiKey });
    onProgress(10, "Initializing AI-powered text extraction...");
    
    const requestFn = async () => {
        onProgress(30, "Connecting to Google Gemini AI for OCR...");
        const ocrPrompt = `You are an expert OCR system. Extract ALL visible text from this image with maximum accuracy.

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of text, no matter how small.
2. Maintain exact formatting, spacing, and line breaks.
3. Support multiple languages.
4. Identify mathematical equations, formulas, and special characters.
5. **Vector Notation**: Recognize vector arrows above characters. Represent them by placing a combining overline character (U+0305) over EACH character in the vector.
6. Provide a confidence score for your extraction from 0-100.
Return a JSON object matching the provided schema.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING, description: "All extracted text from the image, preserving original formatting." },
                confidence: { type: Type.INTEGER, description: "Your confidence in the extraction accuracy from 0 to 100." }
            },
            required: ['text', 'confidence']
        };
        
        return ai.models.generateContent({
            model: OCR_MODEL,
            contents: { parts: [{ inlineData: { data: imageBase64, mimeType: 'image/png'}}, { text: ocrPrompt }] },
            config: { 
                temperature: 0.1, 
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
    };
    
    const ocrResponse = await withRetry(requestFn, (status) => onProgress(30, status));
    
    onProgress(80, "Processing OCR response...");
    
    const rawText = ocrResponse.text;
    if (!rawText) {
        const finishReason = ocrResponse.candidates?.[0]?.finishReason;
        let errorMessage = "The AI returned an empty response. This could be due to a network issue or an issue with the file.";
        if (finishReason === 'SAFETY') {
            errorMessage = "The request was blocked by the API's safety filters. Please try with a different image.";
        }
        throw new Error(errorMessage);
    }
    
    let result;
    try {
        const cleanedText = cleanJsonString(rawText);
        result = JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse JSON response for OCR:", rawText);
        throw new Error(`There was an issue processing the AI's response. Please try again. Error: ${e instanceof Error ? e.message : String(e)}`);
    }

    onProgress(100, "Extraction complete!");

    return { 
        text: result.text || "", 
        confidence: result.confidence || 90, 
        detectedImages: [] 
    };
}

export async function performQAC(apiKey: string, originalText: string, imageBase64: string): Promise<{ correctedText: string, fixes: QACFix[] }> {
    const ai = new GoogleGenAI({ apiKey });

    const requestFn = async () => {
        const prompt = `You are an expert text and mathematical expression correction specialist. Analyze the following OCR-extracted text, using the provided image as the absolute source of truth.

**CRITICAL INSTRUCTIONS:**
1. Fix all spelling, grammar, and character recognition errors.
2. Ensure formatting (spacing, line breaks) perfectly matches the image.
3. Format ALL mathematical expressions for MS Word/Google Docs compatibility using proper Unicode symbols (e.g., superscripts x², subscripts H₂O, symbols ∫∑√π, and vectors with a combining overline U+0305 over EACH character).
4. List every change you make. If no changes are needed, return an empty list for 'fixes'.

Original Text to Correct:
---
${originalText}
---

Return a JSON object that strictly adheres to the provided schema.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                correctedText: { type: Type.STRING, description: "The fully corrected text with properly formatted math expressions." },
                fixes: {
                    type: Type.ARRAY,
                    description: "A list of fixes made. Each fix should be an object.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING, description: "The original incorrect text snippet." },
                            corrected: { type: Type.STRING, description: "The corrected text snippet." },
                            type: { type: Type.STRING, description: "The type of correction (e.g., 'Spelling', 'Formatting', 'Math')." },
                            description: { type: Type.STRING, description: "A brief description of the fix." }
                        },
                        required: ['original', 'corrected', 'type', 'description']
                    }
                }
            },
            required: ['correctedText', 'fixes']
        };

        return ai.models.generateContent({
            model: OCR_MODEL,
            contents: { parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType: 'image/png' }}] },
            config: { 
                temperature: 0.1, 
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
    };
    
    const response = await withRetry(requestFn);
    
    const rawText = response.text;
    if (!rawText) {
        const finishReason = response.candidates?.[0]?.finishReason;
        let errorMessage = "The AI returned an empty response for the QAC check.";
        if (finishReason === 'SAFETY') {
            errorMessage = "The QAC request was blocked by the API's safety filters.";
        }
        throw new Error(errorMessage);
    }
    
    let result;
    try {
        const cleanedText = cleanJsonString(rawText);
        result = JSON.parse(cleanedText);
    } catch(e) {
        console.error("Failed to parse JSON response for QAC:", rawText);
        throw new Error(`There was an issue processing the AI's QAC response. Please try again. Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    return { 
        correctedText: result.correctedText || originalText, 
        fixes: result.fixes || [] 
    };
}

export async function enhanceAndRedrawImage(apiKey: string, imageBase64: string, colorize: boolean): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    
    const requestFn = async () => {
        const prompt = `You are an expert image restoration tool. Your task is to enhance the quality of this image for maximum clarity and readability, as if it were for high-accuracy OCR.

CRITICAL INSTRUCTIONS:
1. **Enhance Quality:** Improve sharpness, contrast, and resolution. Remove noise or compression artifacts.
2. **Preserve Content ABSOLUTELY:** DO NOT alter, add, or remove ANY existing text, numbers, symbols, lines, diagrams, or markings.
3. **No Creative Changes:** This is a technical restoration, not an artistic enhancement.
${colorize ? '4. **Apply Colorization:** Colorize the image realistically, but this must NOT interfere with the legibility or accuracy of the content.' : ''}
Return ONLY the enhanced image.`;

        return ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: { parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType: 'image/png' }}] },
            config: { responseModalities: [Modality.IMAGE] }
        });
    };
    
    const response = await withRetry(requestFn);
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
        const base64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;
        return `data:${mimeType};base64,${base64}`;
    }

    throw new Error("Image enhancement failed to return an image.");
}