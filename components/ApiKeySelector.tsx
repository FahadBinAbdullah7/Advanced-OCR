
import React from 'react';
import { KeyIcon, DocumentTextIcon } from './Icons';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {

  const handleSelectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      // Assume success and let the parent component re-check
      onKeySelected(); 
    } catch (e) {
      console.error('Failed to open API key selection:', e);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-blue-500/30 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/20 mb-6">
          <KeyIcon className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">API Key Required for Veo</h1>
        <p className="text-gray-400 mb-6">
          To generate videos, you need to select an API key. This is a mandatory step to use the Veo video generation models.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transform hover:scale-105"
        >
          Select API Key
        </button>
        <div className="mt-6 text-sm text-gray-500">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 hover:text-blue-400 transition-colors">
            <DocumentTextIcon className="h-4 w-4" />
            <span>Learn about billing</span>
          </a>
        </div>
      </div>
    </div>
  );
};
