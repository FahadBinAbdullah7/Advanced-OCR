import React, { useState, useEffect } from 'react';
// Fix: Use ExtractedContent as Extraction type
import type { ExtractedContent as Extraction } from '../types';
import { CopyIcon, DownloadIcon, SpinnerIcon, WandIcon } from './Icons';

interface ResultsPanelProps {
  extraction: Extraction | null;
  onPerformQAC: () => void;
  isLoading: boolean;
}

const cardStyles = "bg-[#1f2937]/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/10";
type Tab = 'Extracted' | 'QAC';

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ extraction, onPerformQAC, isLoading }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Extracted');
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    // When a new extraction is loaded, switch to the best available tab
    if (extraction?.qacText) {
      setActiveTab('QAC');
    } else {
      setActiveTab('Extracted');
    }
  }, [extraction]);

  const getTextToDisplay = () => {
    if (activeTab === 'QAC' && extraction?.qacText) {
      return extraction.qacText;
    }
    // Fix: Use 'text' property instead of 'rawText'
    return extraction?.text || '';
  };
  
  const handleCopy = () => {
    const textToCopy = getTextToDisplay();
    if (navigator.clipboard && textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      });
    }
  };

  const textToShow = getTextToDisplay();

  return (
    <div className={`${cardStyles} p-4 flex flex-col`}>
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-bold text-white">AI Text Extraction Results</h3>
        <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1.5 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm" disabled={!textToShow}>
                 <CopyIcon className="w-5 h-5"/>
                 <span>Copy All</span>
            </button>
             <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors" disabled>
                 <DownloadIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>
      {copySuccess && <p className="text-right text-xs text-green-400 -mt-2 mb-2">{copySuccess}</p>}
      
      {extraction && (
        <p className="text-xs text-gray-400 mb-3 truncate">
            {/* Fix: Use 'pageNumber' property instead of 'page' */}
            {extraction.fileName} • Page {extraction.pageNumber}
            {extraction.confidence !== null && ` • Confidence: ${extraction.confidence}%`}
        </p>
      )}

      {extraction ? (
        <>
            <div className="flex border-b border-gray-700 mb-2">
                <TabButton name="Extracted Text" isActive={activeTab === 'Extracted'} onClick={() => setActiveTab('Extracted')} />
                <TabButton name="QAC Fixes" isActive={activeTab === 'QAC'} onClick={() => setActiveTab('QAC')} hasContent={!!extraction.qacText} />
                <TabButton name="Images (0)" isActive={false} onClick={() => {}} disabled />
                <div className="flex-grow border-b-2 border-gray-700"></div>
            </div>

            <div className="relative flex-grow bg-gray-900/50 rounded-lg border border-gray-700 p-3 min-h-[250px] overflow-y-auto">
                {isLoading ? (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4 rounded-lg">
                        <SpinnerIcon className="w-8 h-8 mb-4 text-purple-400" />
                        <p className="font-semibold text-white">AI is working its magic...</p>
                        <p className="text-sm text-gray-300">Analyzing and enhancing text.</p>
                    </div>
                ) : (
                    <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">{textToShow}</pre>
                )}
            </div>

            <button
                onClick={onPerformQAC}
                disabled={isLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
                <WandIcon className="w-5 h-5 text-purple-400" />
                <span>Advanced QAC Text & Math</span>
            </button>

        </>
      ) : (
        <div className="flex-grow bg-gray-900/50 rounded-lg border border-gray-700 p-4 flex items-center justify-center text-center">
            {isLoading ? (
                <div className="text-gray-400">
                    <SpinnerIcon className="w-8 h-8 mx-auto mb-2" />
                    <p>Extracting text...</p>
                </div>
            ) : (
                <p className="text-gray-500">No text could be extracted from this image. Please try with a clearer image or different file.</p>
            )}
        </div>
      )}
    </div>
  );
};


const TabButton = ({ name, isActive, onClick, hasContent, disabled }: { name: string, isActive: boolean, onClick: () => void, hasContent?: boolean, disabled?: boolean }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm font-semibold transition-colors mr-2 relative ${
            isActive ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white border-b-2 border-transparent'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {name}
        {hasContent && !isActive && <span className="absolute top-1 right-0 block h-2 w-2 rounded-full bg-purple-500" />}
    </button>
);
