

import React, { useState, useCallback } from 'react';
import { enhanceAndRedrawImage } from '../services/geminiService';
import { ImageIcon, Loader2Icon, SparklesIcon, PaintbrushIcon, ArrowLeftIcon, DownloadIcon, CodeIcon, CopyIcon } from './Icons';

interface ImageProcessorProps {
  apiKey: string;
  onBack: () => void;
}

// Utility to read file as base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const ImageProcessor: React.FC<ImageProcessorProps> = ({ apiKey, onBack }) => {
  const [originalImage, setOriginalImage] = useState<{ url: string; base64: string } | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [base64Result, setBase64Result] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorize, setColorize] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'url' | 'raw' | null>(null);

  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) return;
    setError(null);
    setEnhancedImage(null);
    setOriginalImage(null);
    setBase64Result(null);
    setIsLoading(true);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error("Please upload a valid image file (PNG, JPG, WEBP).");
      }
      const dataUrl = await fileToBase64(file);
      setOriginalImage({ url: dataUrl, base64: dataUrl.split(',')[1] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load image.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEnhance = async () => {
    if (!originalImage) return;
    setError(null);
    setIsLoading(true);
    setEnhancedImage(null);
    try {
      const resultUrl = await enhanceAndRedrawImage(apiKey, originalImage.base64, colorize);
      setEnhancedImage(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToBase64 = () => {
    if (originalImage) {
      setBase64Result(originalImage.url);
      setCopyStatus(null);
    }
  };
  
  const handleCopy = (type: 'url' | 'raw') => {
    if (!base64Result) return;
    const dataToCopy = type === 'url' ? base64Result : base64Result.split(',')[1];
    navigator.clipboard.writeText(dataToCopy).then(() => {
        setCopyStatus(type);
        setTimeout(() => setCopyStatus(null), 2500);
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans p-4 sm:p-6">
      <header className="w-full max-w-6xl mx-auto flex items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeftIcon className="h-5 w-5" />
          Back to OCR Tool
        </button>
      </header>
      <main className="flex-grow w-full max-w-6xl mx-auto">
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-[#2a2a2a] p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">AI Image Processor</h1>
            <p className="text-gray-400">Enhance quality, improve clarity, and add color to your images using AI.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">1. Upload & Configure</h2>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-[#00aaff] hover:bg-[#2a2a2a]/50 transition-colors bg-black/50"
                onClick={() => document.getElementById('image-upload-input')?.click()}
              >
                 <ImageIcon className="w-12 h-12 mb-4 mx-auto text-gray-500" />
                 <p className="text-gray-400">{originalImage ? "Click to change image" : "Click to upload an image"}</p>
                 <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                 />
              </div>

              {/* Controls */}
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between bg-black/50 p-3 rounded-lg">
                    <label htmlFor="colorize-toggle" className="font-semibold flex items-center gap-2 text-white"><PaintbrushIcon className="w-5 h-5 text-[#00aaff]"/> Colorize Image</label>
                    <input type="checkbox" id="colorize-toggle" checked={colorize} onChange={e => setColorize(e.target.checked)} className="h-5 w-5 rounded bg-[#2a2a2a] border-[#444] text-[#00aaff] focus:ring-[#00aaff]"/>
                </div>
                <button
                    onClick={handleEnhance}
                    disabled={!originalImage || isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c026d3] to-[#00aaff] hover:scale-[1.03] transition-all disabled:from-gray-600 disabled:to-gray-700 disabled:scale-100 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                >
                    {isLoading ? <Loader2Icon className="h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
                    <span>{isLoading ? 'Processing...' : 'Enhance Image'}</span>
                </button>
                <button
                    onClick={handleConvertToBase64}
                    disabled={!originalImage || isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#00aaff] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                    <CodeIcon className="h-5 w-5" />
                    <span>Convert to Base64</span>
                </button>

                {base64Result && (
                    <div className="space-y-2 pt-2">
                        <h3 className="font-semibold text-gray-400">Base64 Result</h3>
                        <textarea
                            readOnly
                            value={`Preview: ${base64Result.slice(0, 70)}...`}
                            className="w-full h-24 bg-black text-gray-400 text-xs font-mono rounded-lg p-2 border border-[#2a2a2a] resize-none focus:ring-1 focus:ring-[#00aaff]"
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => handleCopy('url')}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${copyStatus === 'url' ? 'bg-green-600 text-white' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-[#444] hover:border-[#00aaff]'}`}
                            >
                                <CopyIcon className="w-4 h-4" />
                                {copyStatus === 'url' ? 'Copied!' : 'Copy Data URL'}
                            </button>
                            <button 
                                onClick={() => handleCopy('raw')}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${copyStatus === 'raw' ? 'bg-green-600 text-white' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-[#444] hover:border-[#00aaff]'}`}
                            >
                                <CodeIcon className="w-4 h-4" />
                                {copyStatus === 'raw' ? 'Copied!' : 'Copy Raw Base64'}
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
               <h2 className="text-xl font-semibold mb-3 text-white">2. View Result</h2>
               <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                     <h3 className="font-semibold text-gray-400">Original</h3>
                     <div className="aspect-square bg-black/50 rounded-lg flex items-center justify-center p-2 border border-[#2a2a2a]">
                        {originalImage ? <img src={originalImage.url} className="max-w-full max-h-full object-contain rounded"/> : <p className="text-gray-600">No image uploaded</p>}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-400">Enhanced</h3>
                        {enhancedImage && (
                            <a href={enhancedImage} download="enhanced-image.png" className="flex items-center gap-1 text-xs text-[#00aaff] hover:text-cyan-300">
                                <DownloadIcon className="w-4 h-4" /> Download
                            </a>
                        )}
                     </div>
                     <div className="aspect-square bg-black/50 rounded-lg flex items-center justify-center p-2 border border-[#2a2a2a]">
                        {isLoading && !enhancedImage && <Loader2Icon className="w-10 h-10 text-[#00aaff]" />}
                        {!isLoading && enhancedImage && <img src={enhancedImage} className="max-w-full max-h-full object-contain rounded"/>}
                        {!isLoading && !enhancedImage && <p className="text-gray-600">Result will appear here</p>}
                     </div>
                  </div>
               </div>
            </div>
          </div>
          {error && <div className="mt-6 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm">{error}</div>}
        </div>
      </main>
    </div>
  );
};