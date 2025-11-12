import React from 'react';
import { ImageIcon } from './Icons';

interface HeaderProps {
    onNavigateToImageProcessor: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToImageProcessor }) => {
  return (
    <header className="w-full py-4 px-4 sm:px-6 border-b border-gray-700/50">
      <div className="w-full max-w-[100rem] mx-auto flex items-center justify-between">
        <div className="w-48"></div> {/* Spacer */}
        
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Advanced OCR Tool
            </h1>
            <p className="text-md text-gray-400 mt-1">
            Extract text from PDFs and images with AI
            </p>
        </div>
        
        <div className="w-48 flex justify-end">
            <button
                onClick={onNavigateToImageProcessor}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
            >
                <ImageIcon className="h-4 w-4" />
                <span>Image Processor</span>
            </button>
        </div>
      </div>
    </header>
  );
};
