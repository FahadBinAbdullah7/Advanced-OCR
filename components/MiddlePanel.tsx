

import React, { useState, MouseEvent } from 'react';
import type { CropRect } from '../types';
import { Loader2Icon, ZoomInIcon, ZoomOutIcon, ScanSearchIcon, CropIcon, XIcon, FileTextIcon, ImageIcon } from './Icons';

interface MiddlePanelProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    selectedFile: File | null;
    isLoadingFile: boolean;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onCrop: (rect: CropRect | null) => void;
    onResetCrop: () => void;
    originalCanvasData: React.RefObject<ImageData | null>;
}

const Card: React.FC<{children: React.ReactNode, className?: string, header?: React.ReactNode}> = ({ children, className, header }) => (
    <div className={`bg-[#1a1a1a] rounded-xl shadow-lg border border-[#2a2a2a] p-4 flex flex-col transition-all duration-300 hover:border-[#00aaff] hover:shadow-[0_0_15px_rgba(0,170,255,0.2)] ${className}`}>
        {header}
        {children}
    </div>
);

export const MiddlePanel: React.FC<MiddlePanelProps> = ({ canvasRef, selectedFile, isLoadingFile, zoom, onZoomChange, onCrop, onResetCrop, originalCanvasData }) => {
    const [isSelectingArea, setIsSelectingArea] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);
    const [cropRect, setCropRect] = useState<CropRect | null>(null);

    const getCanvasPoint = (e: MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!isSelectingArea) return;
        const point = getCanvasPoint(e);
        setStartCoords(point);
        setCropRect({ ...point, width: 0, height: 0 });
        setIsCropping(true);
    };

    const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!isCropping || !startCoords) return;
        const currentPoint = getCanvasPoint(e);
        const newRect: CropRect = {
            x: Math.min(startCoords.x, currentPoint.x),
            y: Math.min(startCoords.y, currentPoint.y),
            width: Math.abs(currentPoint.x - startCoords.x),
            height: Math.abs(currentPoint.y - startCoords.y)
        };
        
        // Redraw original and then selection
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(originalCanvasData.current!, 0, 0);
        ctx.strokeStyle = 'rgba(0, 170, 255, 0.9)';
        ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(newRect.x, newRect.y, newRect.width, newRect.height);
        ctx.setLineDash([]);
        
        setCropRect(newRect);
    };

    const handleMouseUp = () => {
        setIsCropping(false);
    };
    
    const handleConfirmCrop = () => {
        if (cropRect && cropRect.width > 10 && cropRect.height > 10) {
            onCrop(cropRect);
        } else {
             onResetCrop(); // Reset if crop is too small
        }
        setIsSelectingArea(false);
        setCropRect(null);
        setStartCoords(null);
    };

    const handleCancelCrop = () => {
        onResetCrop();
        setIsSelectingArea(false);
        setCropRect(null);
        setStartCoords(null);
    };

    const header = (
        <div className="mb-3">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">File Preview</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSelectingArea(!isSelectingArea)} disabled={!selectedFile} className={`p-1.5 rounded-md disabled:opacity-50 transition-colors ${isSelectingArea ? 'bg-gradient-to-r from-[#c026d3] to-[#00aaff] text-white' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#00aaff]'}`}>
                        <ScanSearchIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => onZoomChange(zoom - 25)} disabled={!selectedFile || zoom <= 25} className="p-1.5 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#00aaff] disabled:opacity-50 transition-colors"><ZoomOutIcon className="w-5 h-5"/></button>
                    <span className="text-sm font-semibold w-12 text-center text-white">{zoom}%</span>
                    <button onClick={() => onZoomChange(zoom + 25)} disabled={!selectedFile || zoom >= 200} className="p-1.5 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#00aaff] disabled:opacity-50 transition-colors"><ZoomInIcon className="w-5 h-5"/></button>
                </div>
            </div>
            {isSelectingArea && (
                <div className="mt-2 flex gap-2 items-center bg-black/50 p-2 rounded-md">
                    <p className="text-xs text-[#00aaff] flex-grow">Draw a box on the preview to select an area for extraction.</p>
                    <button onClick={handleConfirmCrop} disabled={!cropRect || cropRect.width < 10} className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-[#c026d3] to-[#00aaff] px-3 py-1 rounded-md disabled:opacity-50 hover:scale-105 transition-transform text-white font-semibold"><CropIcon className="w-4 h-4"/> Confirm</button>
                    <button onClick={handleCancelCrop} className="flex items-center gap-1.5 text-sm bg-[#2a2a2a] hover:bg-[#3a3a3a] px-3 py-1 rounded-md text-white"><XIcon className="w-4 h-4"/> Cancel</button>
                </div>
            )}
        </div>
    );

    return (
        <Card header={header} className="h-full">
            <div className="relative flex-grow bg-black/50 rounded-lg border border-[#2a2a2a] flex items-center justify-center overflow-auto p-2 min-h-[400px] lg:min-h-0">
                {selectedFile ? (
                    <div className="relative">
                        <canvas 
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={() => setIsCropping(false)}
                            className={`shadow-lg bg-white ${isSelectingArea ? 'cursor-crosshair' : ''}`} 
                        />
                        {isLoadingFile && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4 rounded-lg">
                                <Loader2Icon className="w-8 h-8 mb-4 text-[#00aaff]" />
                                <p className="font-semibold text-white">Rendering file...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <div className="flex gap-4 mb-4"><FileTextIcon className="w-16 h-16" /><ImageIcon className="w-16 h-16" /></div>
                        <p>Upload a file to see the preview</p>
                    </div>
                )}
            </div>
        </Card>
    );
};