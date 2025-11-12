import React from 'react';
// Fix: Use ExtractedContent type as Extraction is not defined
import type { ExtractedContent as Extraction } from '../types';

interface ExtractionHistoryPanelProps {
  extractions: Extraction[];
  activeExtractionId: string | null;
  onSelectExtraction: (id: string) => void;
}

const cardStyles = "bg-[#1f2937]/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/10";

export const ExtractionHistoryPanel: React.FC<ExtractionHistoryPanelProps> = ({ extractions, activeExtractionId, onSelectExtraction }) => {
  return (
    <div className={`${cardStyles} p-4 flex flex-col`}>
      <h3 className="text-lg font-bold text-white mb-3">Extraction History</h3>
      {extractions.length > 0 ? (
        <div className="flex-grow overflow-y-auto max-h-48 pr-2">
            <ul className="space-y-2">
            {extractions.map((ext) => (
                <li key={ext.id}>
                    <button
                        onClick={() => onSelectExtraction(ext.id)}
                        className={`w-full text-left p-2 rounded-md transition-colors text-sm ${
                            activeExtractionId === ext.id
                            ? 'bg-purple-600/50 text-white'
                            : 'bg-gray-700/50 hover:bg-gray-700/80 text-gray-300'
                        }`}
                    >
                        {/* Fix: Use pageNumber instead of page */}
                        <p className="font-semibold truncate">{ext.fileName} - Page {ext.pageNumber}</p>
                        {/* Fix: Use timestamp property from ExtractedContent */}
                        <p className="text-xs text-gray-400">{ext.timestamp.toLocaleTimeString()}</p>
                    </button>
                </li>
            ))}
            </ul>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-center text-gray-500 text-sm">
          <p>Your extraction history will appear here.</p>
        </div>
      )}
       <p className="text-xs text-gray-500 text-right mt-2">{extractions.length} AI text extractions</p>
    </div>
  );
};
