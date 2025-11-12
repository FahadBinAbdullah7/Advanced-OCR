import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, EyeIcon } from './Icons';

interface ActionPanelProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onExtract: () => void;
  isActionDisabled: boolean;
  hasCrop: boolean;
}

const cardStyles = "bg-[#1f2937]/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/10";

export const ActionPanel: React.FC<ActionPanelProps> = ({ currentPage, totalPages, onPageChange, onExtract, isActionDisabled, hasCrop }) => {
  
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
        // Allow clearing the input, maybe handle it on blur
    } else {
        const page = parseInt(val, 10);
        if (!isNaN(page) && page > 0 && page <= totalPages) {
            onPageChange(page);
        }
    }
  };

  const handleInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
        onPageChange(currentPage); // Reset to current if empty
    }
  };
  
  return (
    <div className={`${cardStyles} p-4 flex flex-col gap-4`}>
        {totalPages > 1 && (
            <div>
                <h3 className="text-lg font-bold text-white mb-3">Page Navigation</h3>
                <div className="flex items-center justify-between gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isActionDisabled}
                        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous Page"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex items-baseline text-sm text-gray-300">
                        <span>Page</span>
                        <input
                            type="number"
                            value={currentPage}
                            onChange={handlePageInputChange}
                            onBlur={handleInputBlur}
                            className="w-12 mx-2 text-center bg-gray-900/50 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="1"
                            max={totalPages}
                        />
                        <span>of {totalPages}</span>
                    </div>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isActionDisabled}
                        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next Page"
                    >
                        <ArrowRightIcon className="w-5 h-5 text-white" />
                    </button>
                </div>
                 <div className="flex justify-between mt-2 gap-2">
                    <button onClick={() => onPageChange(1)} disabled={isActionDisabled || currentPage === 1} className="w-full text-sm bg-gray-700/80 hover:bg-gray-700 px-4 py-1.5 rounded-md disabled:opacity-50 transition-colors">First</button>
                    <button onClick={() => onPageChange(totalPages)} disabled={isActionDisabled || currentPage === totalPages} className="w-full text-sm bg-gray-700/80 hover:bg-gray-700 px-4 py-1.5 rounded-md disabled:opacity-50 transition-colors">Last</button>
                </div>
            </div>
        )}

      <button
        onClick={onExtract}
        disabled={isActionDisabled}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transform hover:scale-105"
      >
        <EyeIcon className="h-5 w-5" />
        <span>
            {hasCrop ? 'Extract from Selection' : `Extract Text with AI from Page ${currentPage}`}
        </span>
      </button>
    </div>
  );
};