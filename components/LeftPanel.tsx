

import React, { useRef, useState, useEffect } from 'react';
import { UploadIcon, FileTextIcon, ImageIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, Loader2Icon, AlertCircleIcon } from './Icons';

interface LeftPanelProps {
    onFileChange: (file: File) => void;
    selectedFile: File | null;
    fileType: 'pdf' | 'image' | null;
    totalPages: number;
    isLoadingFile: boolean;
    fileError: string | null;
    currentPage: number;
    onPageChange: (page: number) => void;
    onExtract: () => void;
    isProcessing: boolean;
    ocrProgress: number;
    ocrStatus: string;
}

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-[#1f2937]/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 p-4 ${className}`}>
        {children}
    </div>
);

export const LeftPanel: React.FC<LeftPanelProps> = (props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pageInput, setPageInput] = useState(props.currentPage.toString());

    useEffect(() => {
        setPageInput(props.currentPage.toString());
    }, [props.currentPage]);

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
    };
    
    const handlePageInputSubmit = () => {
        const pageNum = parseInt(pageInput, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= props.totalPages) {
            if (pageNum !== props.currentPage) {
                props.onPageChange(pageNum);
            }
        } else {
            // Reset to the current page if the input is invalid
            setPageInput(props.currentPage.toString());
        }
    };

    const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
        }
    };


    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            props.onFileChange(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <>
            <Card>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><UploadIcon className="h-5 w-5" /> Upload File</h3>
                <p className="text-sm text-gray-400 mb-4">Upload a PDF or image file to extract text</p>
                <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex justify-center mb-2">
                        {props.fileType === 'pdf' ? <FileTextIcon className="h-10 w-10 text-gray-400"/> : props.fileType === 'image' ? <ImageIcon className="h-10 w-10 text-gray-400"/> : <><FileTextIcon className="h-10 w-10 text-gray-400"/><ImageIcon className="h-10 w-10 text-gray-400"/></>}
                    </div>
                    <p className="text-sm text-gray-400">{props.selectedFile ? props.selectedFile.name : "Drag & drop or click to browse"}</p>
                    <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={(e) => e.target.files && props.onFileChange(e.target.files[0])} className="hidden" />
                </div>
                {props.selectedFile && (
                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-sm font-semibold truncate">{props.selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(props.selectedFile.size / 1024 / 1024).toFixed(2)} MB {props.totalPages > 0 ? ` • ${props.totalPages} pages` : ''}</p>
                    </div>
                )}
                {props.fileError && (
                    <div className="mt-4 p-2 bg-red-900/50 border border-red-500/50 rounded-lg flex items-center gap-2 text-sm text-red-300">
                        <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
                        <span>{props.fileError}</span>
                    </div>
                )}
            </Card>

            {props.fileType === 'pdf' && props.totalPages > 0 && (
                <Card>
                    <h3 className="text-lg font-bold text-white mb-3">Page Navigation</h3>
                    <div className="flex items-center justify-between gap-2">
                         <button 
                            onClick={() => props.onPageChange(props.currentPage - 1)} 
                            disabled={props.currentPage <= 1 || props.isLoadingFile} 
                            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                            aria-label="Previous Page"
                        >
                            <ChevronLeftIcon className="w-5 h-5"/>
                        </button>
                        <div className="flex items-center justify-center gap-1 text-sm tabular-nums text-gray-300">
                            <label htmlFor="page-input" className="whitespace-nowrap">Page:</label>
                            <input
                                id="page-input"
                                type="number"
                                value={pageInput}
                                onChange={handlePageInputChange}
                                onBlur={handlePageInputSubmit}
                                onKeyDown={handlePageInputKeyDown}
                                disabled={props.isLoadingFile}
                                className="w-14 h-8 text-center bg-[#0e1320] rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="1"
                                max={props.totalPages}
                                aria-current="page"
                            />
                            <span className="whitespace-nowrap">of {props.totalPages}</span>
                        </div>
                         <button 
                            onClick={() => props.onPageChange(props.currentPage + 1)} 
                            disabled={props.currentPage >= props.totalPages || props.isLoadingFile} 
                            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                            aria-label="Next Page"
                        >
                            <ChevronRightIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </Card>
            )}

            <button
              onClick={props.onExtract}
              disabled={!props.selectedFile || props.isProcessing || props.isLoadingFile}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {props.isProcessing ? <><Loader2Icon className="h-5 w-5"/> <span>Processing...</span></> : <><EyeIcon className="h-5 w-5" /><span>Extract Text with AI</span></>}
            </button>

            {props.isProcessing && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>{props.ocrStatus}</span>
                        <span>{props.ocrProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${props.ocrProgress}%`}}></div></div>
                </div>
            )}
        </>
    );
};