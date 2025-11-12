
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
    <div className={`bg-[#1f2937]/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 p-4 ${className}`}>
        {children}
    </div>
);

const TabButton: React.FC<{ name: string, count?: number, isActive: boolean, onClick: () => void, disabled?: boolean }> = ({ name, count, isActive, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`px-3 py-1.5 text-sm font-semibold transition-colors mr-2 ${ isActive ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white border-b-2 border-transparent'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {name} {typeof count !== 'undefined' && `(${count})`}
    </button>
);

export const RightPanel: React.FC<RightPanelProps> = ({ extraction, extractions, onSelectExtraction, onPerformQAC, isQACProcessing, onImageAction, onColorizeToggle }) => {
    const [activeTab, setActiveTab] = useState<Tab>('text');

    useEffect(() => {
        if (extraction?.isQACProcessed) setActiveTab('qac');
        else setActiveTab('text');
    }, [extraction]);

    const textToDisplay = extraction?.isQACProcessed ? extraction.qacText : extraction?.text;

    return (
        <>
            <Card className="flex flex-col">
                <h3 className="text-lg font-bold text-white mb-1">AI Text Extraction Results</h3>
                {extraction ? (
                    <p className="text-xs text-gray-400 mb-3 truncate">
                        {extraction.fileName} • Page {extraction.pageNumber} • Confidence: {extraction.confidence}%
                    </p>
                ) : <p className="text-xs text-gray-500 mb-3">No extraction selected</p>}

                {extraction ? (
                    <>
                        <div className="flex border-b border-gray-700">
                            <TabButton name="Extracted Text" isActive={activeTab === 'text'} onClick={() => setActiveTab('text')} />
                            <TabButton name="QAC Fixes" count={extraction.qacFixes?.length} isActive={activeTab === 'qac'} onClick={() => setActiveTab('qac')} />
                            <TabButton name="Images" count={extraction.detectedImages?.length} isActive={activeTab === 'images'} onClick={() => setActiveTab('images')} />
                        </div>
                        <div className="flex-grow overflow-hidden mt-2">
                             {/* Text Tab */}
                             {activeTab === 'text' && (
                                <div className="flex flex-col h-full">
                                    <textarea value={textToDisplay} readOnly className="flex-grow bg-gray-900/50 rounded-lg border border-gray-700 p-3 text-sm font-mono whitespace-pre-wrap w-full min-h-[250px] resize-none" placeholder="Extracted text will appear here..."/>
                                    <button onClick={onPerformQAC} disabled={isQACProcessing} className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                        {isQACProcessing ? <><Loader2Icon className="w-5 h-5"/> Processing...</> : <><Wand2Icon className="w-5 h-5 text-purple-400" /> Advanced QAC Text & Math</>}
                                    </button>
                                </div>
                             )}
                             {/* QAC Tab */}
                             {activeTab === 'qac' && (
                                <div className="h-[300px] overflow-y-auto pr-2">
                                    {extraction.isQACProcessed ? (
                                        extraction.qacFixes && extraction.qacFixes.length > 0 ? (
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50"><tr><th className="px-2 py-2">Original</th><th className="px-2 py-2">Corrected</th><th className="px-2 py-2">Type</th></tr></thead>
                                                <tbody>{extraction.qacFixes.map((fix, i) => (<tr key={i} className="border-b border-gray-700 hover:bg-gray-800/50"><td className="px-2 py-1 font-mono text-red-400">{fix.original}</td><td className="px-2 py-1 font-mono text-green-400">{fix.corrected}</td><td className="px-2 py-1">{fix.type}</td></tr>))}</tbody>
                                            </table>
                                        ) : (<div className="h-full flex items-center justify-center text-gray-500 text-center"><CheckCheckIcon className="h-10 w-10 mx-auto mb-2" /><p>No fixes needed. The text appears to be accurate.</p></div>)
                                    ) : (<div className="h-full flex items-center justify-center text-gray-500 text-center"><Wand2Icon className="h-10 w-10 mx-auto mb-2" /><p>Run "Advanced QAC" to check and correct the text.</p></div>)}
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
                    </>
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
                        <button key={ext.id} onClick={() => onSelectExtraction(ext)} className={`w-full text-left p-2 rounded-md transition-colors text-sm ${extraction?.id === ext.id ? 'bg-purple-600/50' : 'bg-gray-700/50 hover:bg-gray-700/80'}`}>
                            <p className="font-semibold truncate">{ext.fileName} - P{ext.pageNumber}</p>
                            <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</p>
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
        if (!image.base64) {
            // This is a placeholder as base64 is generated on detection now.
            // In a real scenario, we might refetch if it was missing.
        }
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
            // Scale to fit a max width/height for display
            const MAX_DIM = 150;
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
        <div className="bg-gray-800/70 p-3 rounded-lg">
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    {image.enhancedImageUrl ? 
                        <img src={image.enhancedImageUrl} alt="Enhanced" className="border rounded-md shadow-sm w-auto h-auto max-w-[150px] max-h-[150px]" /> : 
                        <canvas ref={canvasRef} className="border rounded-md shadow-sm" />
                    }
                </div>
                <div className="flex-grow space-y-2">
                    <p className="text-xs text-gray-400">{image.description || "Detected visual element"}</p>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id={`colorize-${image.id}`} checked={!!image.colorize} onChange={e => onColorizeToggle(image.id, e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600"/>
                        <label htmlFor={`colorize-${image.id}`} className="text-sm flex items-center gap-1.5"><PaintbrushIcon className="h-4 w-4"/> Colorize</label>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => onImageAction(image.id, 'enhance', !!image.colorize)} disabled={image.isProcessing} className="text-xs flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-md hover:bg-gray-600 disabled:opacity-50"><PaletteIcon className="h-3 w-3"/> Enhance</button>
                        <button onClick={getBase64} disabled={image.isProcessing} className="text-xs flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-md hover:bg-gray-600 disabled:opacity-50"><CodeIcon className="h-3 w-3"/> Base64</button>
                    </div>
                </div>
            </div>
            {showBase64 && (
                <textarea readOnly value={image.base64} className="mt-2 w-full h-16 bg-gray-900 text-xs font-mono p-1 rounded-md border border-gray-700"/>
            )}
            {image.isProcessing && <p className="text-xs text-purple-400 mt-1 animate-pulse">Processing image...</p>}
        </div>
    );
};
