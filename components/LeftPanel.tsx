

import React, { useRef } from 'react';
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
    <div className={`bg-[#1a1a1a] rounded-xl shadow-lg border border-[#2a2a2a] p-4 transition-all duration-300 hover:border-[#00aaff] hover:shadow-[0_0_15px_rgba(0,170,255,0.2)] ${className}`}>
        {children}
    </div>
);

export const LeftPanel: React.FC<LeftPanelProps> = (props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                <p className="text-sm text-gray-400 mb-4">Upload a PDF or image file to start.</p>
                <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-[#00aaff] hover:bg-[#2a2a2a]/50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex justify-center mb-2">
                        {props.fileType === 'pdf' ? <FileTextIcon className="h-10 w-10 text-gray-500"/> : props.fileType === 'image' ? <ImageIcon className="h-10 w-10 text-gray-500"/> : <><FileTextIcon className="h-10 w-10 text-gray-500"/><ImageIcon className="h-10 w-10 text-gray-500"/></>}
                    </div>
                    <p className="text-sm text-gray-400">{props.selectedFile ? props.selectedFile.name : "Drag & drop or click to browse"}</p>
                    <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={(e) => e.target.files && props.onFileChange(e.target.files[0])} className="hidden" />
                </div>
                {props.selectedFile && (
                    <div className="mt-4 p-3 bg-black/50 rounded-lg">
                        <p className="text-sm font-semibold truncate text-white">{props.selectedFile.name}</p>
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
                         <button onClick={() => props.onPageChange(props.currentPage - 1)} disabled={props.currentPage <= 1 || props.isLoadingFile} className="p-2 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#00aaff] disabled:opacity-50 transition-colors"><ChevronLeftIcon className="w-5 h-5"/></button>
                         <span className="text-sm font-semibold text-white">Page {props.currentPage} of {props.totalPages}</span>
                         <button onClick={() => props.onPageChange(props.currentPage + 1)} disabled={props.currentPage >= props.totalPages || props.isLoadingFile} className="p-2 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#00aaff] disabled:opacity-50 transition-colors"><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                </Card>
            )}

            <div className="space-y-3">
                <button
                onClick={props.onExtract}
                disabled={!props.selectedFile || props.isProcessing || props.isLoadingFile}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c026d3] to-[#00aaff] hover:scale-[1.03] transition-all disabled:from-gray-600 disabled:to-gray-700 disabled:scale-100 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                >
                {props.isProcessing ? <><Loader2Icon className="h-5 w-5"/> <span>Processing...</span></> : <><EyeIcon className="h-5 w-5" /><span>Extract Text with AI</span></>}
                </button>
            </div>

            {props.isProcessing && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>{props.ocrStatus}</span>
                        <span>{props.ocrProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-gradient-to-r from-[#c026d3] to-[#00aaff] h-1.5 rounded-full transition-all duration-300" style={{width: `${props.ocrProgress}%`}}></div></div>
                </div>
            )}
        </>
    );
};