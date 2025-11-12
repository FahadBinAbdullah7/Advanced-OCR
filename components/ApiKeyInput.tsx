
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
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8 max-w-md w-full text-center">
        <KeyIcon className="mx-auto h-12 w-12 text-cyan-400 mb-4" />
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
            className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all mb-4"
          />
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!key.trim()}
          >
            Save and Continue
          </button>
        </form>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-cyan-400 mt-4 inline-block">
          Get an API Key from Google AI Studio
        </a>
      </div>
    </div>
  );
};