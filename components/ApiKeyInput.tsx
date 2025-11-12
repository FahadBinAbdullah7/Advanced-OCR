
import React, { useState } from 'react';
import { KeyIcon } from './Icons';

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onKeySubmit(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg border p-8 max-w-md w-full text-center animate-glow-border">
        <KeyIcon className="mx-auto h-12 w-12 text-[#00aaff] mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Enter Your Gemini API Key</h2>
        <p className="text-gray-400 mb-6">
          To use this application, please provide your own Google Gemini API key. Your key is stored only in your browser for this session.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your API key..."
            className="w-full bg-[#2a2a2a] text-white rounded-lg p-3 border border-[#444] focus:ring-2 focus:ring-[#00aaff] focus:border-[#00aaff] transition-all mb-4"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#c026d3] to-[#00aaff] hover:scale-[1.03] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:from-gray-600 disabled:to-gray-700 disabled:scale-100 disabled:cursor-not-allowed"
            disabled={!key.trim()}
          >
            Save and Continue
          </button>
        </form>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-[#00aaff] mt-4 inline-block">
          Get an API Key from Google AI Studio
        </a>
      </div>
    </div>
  );
};