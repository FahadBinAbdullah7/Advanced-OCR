

import React, { useState, useEffect } from 'react';
import type { ExtractedContent, DetectedImage } from '../types';
import { CopyIcon, DownloadIcon, Loader2Icon, Wand2Icon, CheckCheckIcon, ImageIcon, CropIcon, PaletteIcon, CodeIcon, PaintbrushIcon } from './Icons';

type Tab = 'text' | 'qac' | 'images';

interface RightPanelProps {
    extraction: ExtractedContent | null;
    extractions: ExtractedContent[];
    onSelectExtraction: (extraction: ExtractedContent) => void;
    onPerformQAC: () => void;
    isQACProcessing: boolean;
    onImageAction: (imageId: string, action: 'enhance' | 'base64', colorize: boolean) => void;
    onColorizeToggle: (id: string, checked: boolean) => void;
}

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-[#1a1a1a] rounded-xl shadow-lg border border-[#2a2a2a] p-4 transition-all duration-300 hover:border-[#00aaff] hover:shadow-[0_0_15px_rgba(0,170,255,0.2)] ${className}`}>
        {children}
    </div>
);

const TabButton: React.FC<{ name: string, count?: number, isActive: boolean, onClick: () => void, disabled?: boolean }> = ({ name, count, isActive, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`px-3 py-1.5 text-sm font-semibold transition-colors mr-2 relative ${ isActive ? 'text-[#00aaff] border-b-2 border-[#00aaff]' : 'text-gray-400 hover:text-white border-b-2 border-transparent'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {name} {typeof count !== 'undefined' && `(${count})`}
    </button>
);

export const RightPanel: React.FC<RightPanelProps> = ({ extraction, extractions, onSelectExtraction, onPerformQAC, isQACProcessing, onImageAction, onColorizeToggle }) => {
    const [activeTab, setActiveTab] = useState<Tab>('text');

    useEffect(() => {
        if (extraction?.isQACProcessed) setActiveTab('qac');
        else setActiveTab('text');
    }, [extraction]);

    return (
        <>
            <Card className="flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white mb-1">AI Extraction Results</h3>
                {extraction ? (
                    <p className="text-xs text-gray-400 mb-3 truncate">
                        {extraction.fileName} • Page {extraction.pageNumber} • Confidence: {extraction.confidence}%
                    </p>
                ) : <p className="text-xs text-gray-500 mb-3">No extraction selected</p>}

                {extraction ? (
                    <div className="flex flex-col flex-grow">
                        <div className="flex border-b border-[#2a2a2a]">
                            <TabButton name="Text" isActive={activeTab === 'text'} onClick={() => setActiveTab('text')} />
                            <TabButton name="QAC Fixes" count={extraction.qacFixes?.length} isActive={activeTab === 'qac'} onClick={() => setActiveTab('qac')} />
                            <TabButton name="Images" count={extraction.detectedImages?.length} isActive={activeTab === 'images'} onClick={() => setActiveTab('images')} />
                        </div>
                        <div className="flex-grow overflow-hidden mt-2 flex flex-col">
                             {/* Text Tab */}
                             {activeTab === 'text' && (
                                <div className="flex flex-col h-full">
                                    <textarea value={extraction.text} readOnly className="flex-grow bg-[#2a2a2a] rounded-lg border border-[#444] p-3 text-sm font-mono whitespace-pre-wrap w-full min-h-[250px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00aaff] focus:border-[#00aaff]" placeholder="Extracted text will appear here..."/>
                                    <button onClick={onPerformQAC} disabled={isQACProcessing} className="w-full mt-3 flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#00aaff] disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                        {isQACProcessing ? <><Loader2Icon className="w-5 h-5"/> Processing...</> : <><Wand2Icon className="w-5 h-5 text-[#00aaff]" /> Advanced QAC & Math</>}
                                    </button>
                                </div>
                             )}
                             {/* QAC Tab */}
                             {activeTab === 'qac' && (
                                <div className="h-full flex flex-col">
                                    <textarea value={extraction.qacText} readOnly className="flex-grow bg-[#2a2a2a] rounded-lg border border-[#444] p-3 text-sm font-mono whitespace-pre-wrap w-full min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00aaff] focus:border-[#00aaff]" placeholder="Corrected text will appear here..."/>
                                    <div className="h-[150px] overflow-y-auto pr-2 mt-2 border-t border-[#2a2a2a] pt-2">
                                        {extraction.isQACProcessed ? (
                                            extraction.qacFixes && extraction.qacFixes.length > 0 ? (
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-400 uppercase bg-black/50"><tr><th className="px-2 py-2">Original</th><th className="px-2 py-2">Corrected</th><th className="px-2 py-2">Type</th></tr></thead>
                                                    <tbody>{extraction.qacFixes.map((fix, i) => (<tr key={i} className="border-b border-[#2a2a2a] hover:bg-black/50"><td className="px-2 py-1 font-mono text-red-400">{fix.original}</td><td className="px-2 py-1 font-mono text-green-400">{fix.corrected}</td><td className="px-2 py-1">{fix.type}</td></tr>))}</tbody>
                                                </table>
                                            ) : (<div className="h-full flex items-center justify-center text-gray-500 text-center"><CheckCheckIcon className="h-10 w-10 mx-auto mb-2" /><p>No fixes needed. The text appears to be accurate.</p></div>)
                                        ) : (<div className="h-full flex items-center justify-center text-gray-500 text-center"><Wand2Icon className="h-10 w-10 mx-auto mb-2" /><p>Run "Advanced QAC" to check and correct the text.</p></div>)}
                                    </div>
                                </div>
                             )}
                            {/* Images Tab */}
                            {activeTab === 'images' && (
                                <div className="h-[300px] overflow-y-auto pr-2 space-y-3">
                                    {extraction.detectedImages && extraction.detectedImages.length > 0 ? (
                                        extraction.detectedImages.map(img => <DetectedImageCard key={img.id} image={img} onImageAction={onImageAction} onColorizeToggle={onColorizeToggle} />)
                                    ) : (<div className="h-full flex items-center justify-center text-gray-500 text-center"><CropIcon className="h-10 w-10 mx-auto mb-2" /><p>No non-text images were detected.</p></div>)}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500 text-sm min-h-[250px]">
                        <p>Upload a file and extract text to see the results.</p>
                    </div>
                )}
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-white mb-3">Extraction History</h3>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                    {extractions.length > 0 ? extractions.map(ext => (
                        <button key={ext.id} onClick={() => onSelectExtraction(ext)} className={`w-full text-left p-2 rounded-md transition-colors text-sm ${extraction?.id === ext.id ? 'bg-[#00aaff]/20 text-white' : 'bg-[#2a2a2a]/50 hover:bg-[#2a2a2a] text-gray-300'}`}>
                            <p className="font-semibold truncate">{ext.fileName} - P{ext.pageNumber}</p>
                            <p className="text-xs text-gray-400">{new Date(ext.timestamp).toLocaleTimeString()}</p>
                        </button>
                    )) : <p className="text-center text-gray-500 text-sm p-4">History will appear here.</p>}
                </div>
            </Card>
        </>
    );
};

const DetectedImageCard: React.FC<{image: DetectedImage, onImageAction: RightPanelProps['onImageAction'], onColorizeToggle: RightPanelProps['onColorizeToggle']}> = ({ image, onImageAction, onColorizeToggle }) => {
    
    const [showBase64, setShowBase64] = useState(false);

    const getBase64 = async () => {
        setShowBase64(!showBase64);
    };

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!canvasRef.current || !image.base64) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = `data:image/png;base64,${image.base64}`;
        img.onload = () => {
            const MAX_DIM = 100;
            let { width, height } = img;
            if (width > height) {
                if (width > MAX_DIM) {
                    height *= MAX_DIM / width;
                    width = MAX_DIM;
                }
            } else {
                if (height > MAX_DIM) {
                    width *= MAX_DIM / height;
                    height = MAX_DIM;
                }
            }
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
        };
    }, [image.base64]);
    
    return (
        <div className="bg-black/70 p-3 rounded-lg">
            <div className="flex gap-3">
                <div className="flex-shrink-0 w-[100px] h-[100px] bg-black/50 rounded-md flex items-center justify-center">
                    {image.enhancedImageUrl ? 
                        <img src={image.enhancedImageUrl} alt="Enhanced" className="border border-[#2a2a2a] rounded-md shadow-sm object-contain w-full h-full" /> : 
                        <canvas ref={canvasRef} className="border border-[#2a2a2a] rounded-md shadow-sm" />
                    }
                </div>
                <div className="flex-grow space-y-2">
                    <p className="text-xs text-gray-400">{image.description || "Detected visual element"}</p>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id={`colorize-${image.id}`} checked={!!image.colorize} onChange={e => onColorizeToggle(image.id, e.target.checked)} className="h-4 w-4 rounded bg-[#2a2a2a] border-[#444] text-[#00aaff] focus:ring-[#00aaff]"/>
                        <label htmlFor={`colorize-${image.id}`} className="text-sm flex items-center gap-1.5"><PaintbrushIcon className="h-4 w-4"/> Colorize</label>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => onImageAction(image.id, 'enhance', !!image.colorize)} disabled={image.isProcessing} className="text-xs flex items-center gap-1 bg-[#2a2a2a] px-2 py-1 rounded-md hover:bg-[#3a3a3a] disabled:opacity-50 border border-[#444] hover:border-[#00aaff]"><PaletteIcon className="h-3 w-3"/> Enhance</button>
                        <button onClick={getBase64} disabled={image.isProcessing} className="text-xs flex items-center gap-1 bg-[#2a2a2a] px-2 py-1 rounded-md hover:bg-[#3a3a3a] disabled:opacity-50 border border-[#444] hover:border-[#00aaff]"><CodeIcon className="h-3 w-3"/> Base64</button>
                    </div>
                </div>
            </div>
            {showBase64 && (
                <textarea readOnly value={image.base64} className="mt-2 w-full h-16 bg-black text-xs font-mono p-1 rounded-md border border-[#2a2a2a] focus:ring-1 focus:ring-[#00aaff]"/>
            )}
            {image.isProcessing && <p className="text-xs text-[#00aaff] mt-1 animate-pulse">Processing image...</p>}
        </div>
    );
};