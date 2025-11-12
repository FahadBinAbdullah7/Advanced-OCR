import React, { useState, useRef, MouseEvent } from 'react';
import { SpinnerIcon, ZoomInIcon, ZoomOutIcon } from './Icons';
import type { Crop } from '../types';

interface PreviewPanelProps {
  imageUrl: string | null;
  isLoading: boolean;
  pageNumber: number;
  onCropComplete: (crop: Crop | null) => void;
  crop: Crop | null;
}

const cardStyles = "bg-[#1f2937]/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/10";

type Point = { x: number; y: number; };
type Rect = { x: number; y: number; width: number; height: number; };

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ imageUrl, isLoading, pageNumber, onCropComplete, crop }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);

  const getPointFromEvent = (e: MouseEvent): Point | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!imageUrl) return;
    e.preventDefault();
    const point = getPointFromEvent(e);
    if (point) {
      setIsCropping(true);
      setStartPoint(point);
      setCropRect({ ...point, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isCropping || !startPoint) return;
    const currentPoint = getPointFromEvent(e);
    if (currentPoint) {
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);
      setCropRect({ x, y, width, height });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    // Only do something if we were in the middle of a crop gesture
    if (isCropping) {
      setIsCropping(false);

      // Check if the drawn rectangle is valid and large enough
      if (cropRect && cropRect.width > 5 && cropRect.height > 5 && imgRef.current) {
        // It's a valid crop, calculate percentage and notify parent
        const imgNode = imgRef.current;
        const { clientWidth, clientHeight } = imgNode;

        const newCrop: Crop = {
          unit: '%',
          x: (cropRect.x / clientWidth) * 100,
          y: (cropRect.y / clientHeight) * 100,
          width: (cropRect.width / clientWidth) * 100,
          height: (cropRect.height / clientHeight) * 100,
        };
        onCropComplete(newCrop);
        
      } else {
        // The crop was too small (a click) or invalid. Clear it.
        setCropRect(null);
        onCropComplete(null);
      }
    }
  };
  
  const displayRect = crop && !isCropping ? {
    x: (crop.x / 100) * (imgRef.current?.clientWidth || 0),
    y: (crop.y / 100) * (imgRef.current?.clientHeight || 0),
    width: (crop.width / 100) * (imgRef.current?.clientWidth || 0),
    height: (crop.height / 100) * (imgRef.current?.clientHeight || 0),
  } : cropRect;


  return (
    <div className={`${cardStyles} p-4 flex flex-col h-full`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-white">PDF Preview - Page {pageNumber}</h3>
        <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors" aria-label="Zoom Out" disabled>
                <ZoomOutIcon className="w-5 h-5"/>
            </button>
             <span className="text-sm font-semibold w-12 text-center">100%</span>
            <button className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors" aria-label="Zoom In" disabled>
                <ZoomInIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative flex-grow bg-gray-900/50 rounded-lg border border-gray-700 flex items-center justify-center overflow-auto p-2 min-h-[400px] lg:min-h-0 cursor-crosshair">
        {isLoading && (
          <div className="text-center text-gray-400">
            <SpinnerIcon className="w-8 h-8 mx-auto mb-2" />
            <p>Loading Preview...</p>
          </div>
        )}
        {!isLoading && imageUrl && (
            <div className="relative">
                <img 
                    ref={imgRef}
                    src={imageUrl} 
                    alt={`Preview of page ${pageNumber}`} 
                    className="max-w-full max-h-full object-contain rounded-md select-none pointer-events-none" 
                />
                 {displayRect && displayRect.width > 0 && (
                    <div
                        className="absolute border-2 border-dashed border-purple-400 bg-purple-400/20"
                        style={{
                            left: `${displayRect.x}px`,
                            top: `${displayRect.y}px`,
                            width: `${displayRect.width}px`,
                            height: `${displayRect.height}px`,
                        }}
                    />
                )}
            </div>
        )}
        {!isLoading && !imageUrl && (
            <p className="text-gray-500">Upload a file to see the preview</p>
        )}
      </div>
    </div>
  );
};