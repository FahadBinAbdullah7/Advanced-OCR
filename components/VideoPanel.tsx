import React, { useState } from 'react';
import type { AspectRatio } from '../types';
import { FilmIcon, SpinnerIcon } from './Icons';

interface VideoPanelProps {
  onGenerate: (prompt: string, aspectRatio: AspectRatio) => void;
  videoUrl: string | null;
  isLoading: boolean;
  loadingMessage: string;
  hasImage: boolean;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({ onGenerate, videoUrl, isLoading, loadingMessage, hasImage }) => {
  const [prompt, setPrompt] = useState<string>('A cinematic, dramatic, and epic video of the subject.');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, aspectRatio);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">3. Generate Video</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Video Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cinematic video with epic lighting"
            className="w-full bg-gray-900/70 text-white rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Aspect Ratio
          </label>
          <div className="flex gap-2">
            {(['16:9', '9:16'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  aspectRatio === ratio
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {ratio === '16:9' ? 'Landscape' : 'Portrait'} ({ratio})
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !hasImage || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              <span>Generating Video...</span>
            </>
          ) : (
            <>
              <FilmIcon className="h-5 w-5" />
              <span>Generate Video</span>
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center -mt-2">
            Note: Video generation uses Veo and may incur costs. OCR uses the cost-effective Gemini Flash model.
        </p>
      </form>
      
      {(isLoading || videoUrl) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Result</h3>
          <div className="w-full bg-gray-900/70 rounded-lg border border-gray-700 aspect-video flex items-center justify-center">
            {isLoading && (
              <div className="text-center text-gray-400 p-4">
                <p className="font-semibold text-lg">Hold tight, magic in progress!</p>
                <p className="text-sm mt-2">{loadingMessage || 'Initializing video generation...'}</p>
                <p className="text-xs mt-4 text-gray-500">Video generation can take a few minutes.</p>
              </div>
            )}
            {videoUrl && !isLoading && (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full rounded-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
