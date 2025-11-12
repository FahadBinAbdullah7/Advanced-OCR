import React from 'react';
import { ArrowRightIcon, ImageIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-4 sm:px-6 border-b border-gray-700/50">
      <div className="w-full max-w-[100rem] mx-auto flex justify-between items-center">
        <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
             Advanced OCR Tool
            </h1>
            <p className="text-sm text-gray-400">
                Extract text from PDFs and images with AI
            </p>
        </div>
        <div className="flex items-center gap-4">
            <p className="text-sm text-green-400 hidden md:flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                AI OCR ready with Google Gemini
            </p>
            <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm">
                <ImageIcon className="h-4 w-4" />
                <span>Image Processor</span>
                <ArrowRightIcon className="h-4 w-4" />
            </button>
        </div>
      </div>
    </header>
  );
};
