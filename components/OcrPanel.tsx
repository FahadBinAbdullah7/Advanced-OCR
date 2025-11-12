import React from 'react';
import { DocumentTextIcon, SparklesIcon, SpinnerIcon } from './Icons';

interface OcrPanelProps {
  onOcr: () => void;
  ocrText: string;
  isLoading: boolean;
  hasImage: boolean;
}

export const OcrPanel: React.FC<OcrPanelProps> = ({ onOcr, ocrText, isLoading, hasImage }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">2. Extract Text (OCR)</h2>
        <button
          onClick={onOcr}
          disabled={isLoading || !hasImage}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              <span>Extracting...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Extract Text</span>
            </>
          )}
        </button>
      </div>
      <div className="relative w-full min-h-[150px] bg-gray-900/70 rounded-lg p-4 border border-gray-700">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                <p className="text-gray-400">Gemini is analyzing the image...</p>
            </div>
        )}
        {ocrText ? (
          <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">{ocrText}</pre>
        ) : (
            !isLoading && <p className="text-gray-500">Extracted text will appear here.</p>
        )}
      </div>
      <p className="text-xs text-gray-500 text-right mt-2">
        Powered by Gemini Flash
      </p>
    </div>
  );
};
