

import React, { useState, useCallback } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon, SpinnerIcon, ArrowLeftIcon, ArrowRightIcon } from './Icons';
import * as pdfjs from 'pdfjs-dist';

// Configure the worker for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface ImageUploaderProps {
  onImageUpload: (file: ImageFile | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // PDF-specific state
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const resetPdfState = () => {
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);
  };

  const renderPdfPage = useCallback(async (doc: pdfjs.PDFDocumentProxy, pageNum: number) => {
    setIsProcessing(true);
    // Clear previous image while rendering new one to show loading state
    setImageUrl(null); 
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      // Fix: The 'RenderParameters' for pdf.js requires the 'canvas' property in this environment.
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const url = canvas.toDataURL('image/jpeg', 0.95); // High quality jpeg
      setImageUrl(url);
      const base64 = url.split(',')[1];
      onImageUpload({ base64, mimeType: 'image/jpeg', url });
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      alert('Failed to render the PDF page.');
      onImageUpload(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onImageUpload]);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    onImageUpload(null);
    setImageUrl(null);
    resetPdfState();
    setIsProcessing(true);

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          setImageUrl(url);
          const base64 = url.split(',')[1];
          onImageUpload({ base64, mimeType: file.type, url });
          setIsProcessing(false);
        };
        reader.onerror = () => {
          throw new Error('Failed to read the image file.');
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        await renderPdfPage(pdf, 1); // This will set isProcessing to false
      } else {
        throw new Error('Please upload a valid image or PDF file.');
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
      onImageUpload(null);
      setIsProcessing(false);
    }
  }, [onImageUpload, renderPdfPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handlePrevPage = () => {
    if (!pdfDoc || currentPage <= 1) return;
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    renderPdfPage(pdfDoc, newPage);
  };

  const handleNextPage = () => {
    if (!pdfDoc || currentPage >= numPages) return;
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    renderPdfPage(pdfDoc, newPage);
  };


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">1. Upload Image or PDF</h2>
      <div 
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 min-h-[200px] flex items-center justify-center ${isDragging ? 'border-blue-400 bg-gray-700/50' : 'border-gray-600 hover:border-blue-500'}`}
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
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        {isProcessing ? (
             <div className="flex flex-col items-center justify-center text-gray-400">
                <SpinnerIcon className="w-12 h-12 mb-4" />
                <p className="text-lg font-semibold">Processing file...</p>
                <p className="text-sm">This may take a moment.</p>
            </div>
        ) : imageUrl ? (
          <div className="relative group">
            <img src={imageUrl} alt="Preview" className="mx-auto max-h-80 rounded-lg shadow-md" />
             <label htmlFor="file-upload" className="absolute inset-0 flex items-center justify-center bg-black/70 text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-lg">
                Click to Change File
             </label>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <UploadIcon className="w-12 h-12 mb-4" />
            <p className="text-lg font-semibold">
              <span className="text-blue-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm">PDF, PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
            <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isProcessing}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
            >
                <ArrowLeftIcon className="w-5 h-5 text-white" />
            </button>
            <span className="font-semibold text-gray-300 tabular-nums">
                Page {currentPage} of {numPages}
            </span>
            <button
                onClick={handleNextPage}
                disabled={currentPage >= numPages || isProcessing}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
            >
                <ArrowRightIcon className="w-5 h-5 text-white" />
            </button>
        </div>
      )}
    </div>
  );
};
