import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon } from './Icons';
import type { FileInfo } from '../types';

interface FileUploadPanelProps {
  onFileChange: (file: File) => void;
  fileInfo: FileInfo | null;
}

const cardStyles = "bg-[#1f2937]/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/10";

export const FileUploadPanel: React.FC<FileUploadPanelProps> = ({ onFileChange, fileInfo }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      onFileChange(files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [onFileChange]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className={`${cardStyles} p-4`}>
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <UploadIcon className="h-6 w-6" /> Upload File
      </h3>
      <p className="text-sm text-gray-400 mb-4">Upload a PDF or image file to extract text</p>
      
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${isDragging ? 'border-purple-400 bg-gray-700/50' : 'border-gray-600 hover:border-purple-500'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <FileIcon className="w-10 h-10 mb-2" />
            <p className="text-base font-semibold">
              <span className="text-purple-400">Choose File</span>
            </p>
            {fileInfo && <p className="text-xs mt-1 truncate max-w-full px-2">{fileInfo.name}</p>}
        </div>
      </div>
      {fileInfo && (
        <div className="mt-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
                <FileIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-white truncate">{fileInfo.name}</p>
                    <p className="text-xs text-gray-500">
                        {(fileInfo.size / 1024 / 1024).toFixed(2)} MB • {fileInfo.totalPages} {fileInfo.totalPages > 1 ? 'pages' : 'page'}
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
