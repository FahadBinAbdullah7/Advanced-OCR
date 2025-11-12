

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ExtractedContent, CropRect } from './types';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { MiddlePanel } from './components/MiddlePanel';
import { RightPanel } from './components/RightPanel';
import { performAdvancedOCR, performQAC, enhanceAndRedrawImage } from './services/geminiService';
import { ApiKeySelector } from './components/ApiKeySelector';

import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isQACProcessing, setIsQACProcessing] = useState(false);

  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");

  const [extractions, setExtractions] = useState<ExtractedContent[]>([]);
  const [activeExtraction, setActiveExtraction] = useState<ExtractedContent | null>(null);
  
  const [zoom, setZoom] = useState(100);
  const [fileError, setFileError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasData = useRef<ImageData | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const keyIsSet = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(keyIsSet);
    } catch (e) {
      console.error('Failed to check for API key:', e);
      setHasApiKey(false);
    }
  };

  const renderPage = useCallback(async (
    file: File,
    type: 'pdf' | 'image',
    pageNum: number = 1,
    currentZoom: number = 100,
    forceReload: boolean = false
  ) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setFileError("Could not get canvas context.");
      return;
    }
    
    setIsLoadingFile(true);
    setFileError(null);

    try {
      if (type === 'image') {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const scaledWidth = img.width * (currentZoom / 100);
            const scaledHeight = img.height * (currentZoom / 100);
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            setTotalPages(1);
            setCurrentPage(1);
            originalCanvasData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve();
          };
          img.onerror = reject;
        });
      } else if (type === 'pdf') {
        let doc = pdfDocument;
        if (forceReload || !doc) {
          const arrayBuffer = await file.arrayBuffer();
          doc = await pdfjs.getDocument(arrayBuffer).promise;
          setPdfDocument(doc);
          setTotalPages(doc.numPages);
        }
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentZoom / 100 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // Fix: 'canvas' property is required in render parameters.
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        setCurrentPage(pageNum);
        originalCanvasData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    } catch(err) {
      console.error("Error rendering file:", err);
      setFileError("Failed to render the file. It might be corrupted or unsupported.");
    } finally {
      setIsLoadingFile(false);
    }
  }, [pdfDocument]);


  const handleFileChange = useCallback((file: File) => {
    const type = file.type === 'application/pdf' ? 'pdf' : (file.type.startsWith('image/') ? 'image' : null);
    if (!type) {
      setFileError("Unsupported file type. Please upload a PDF or an image.");
      return;
    }

    setIsLoadingFile(true); // Show loader immediately
    setFileError(null);
    setSelectedFile(file);
    setFileType(type);
    setPdfDocument(null);
    setExtractions([]);
    setActiveExtraction(null);
    setZoom(100);
    
    // Defer heavy processing to let UI update
    setTimeout(() => {
        renderPage(file, type, 1, 100, true);
    }, 50);

  }, [renderPage]);

  const handlePageChange = (newPage: number) => {
    if (selectedFile && fileType === 'pdf' && newPage > 0 && newPage <= totalPages) {
      renderPage(selectedFile, fileType, newPage, zoom);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    if (selectedFile && fileType) {
      setZoom(newZoom);
      renderPage(selectedFile, fileType, currentPage, newZoom);
    }
  };

  const handleCrop = (cropRect: CropRect | null) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !cropRect || !originalCanvasData.current) return;

      if (cropRect.width === 0 || cropRect.height === 0) { // Reset crop
          canvas.width = originalCanvasData.current.width;
          canvas.height = originalCanvasData.current.height;
          ctx.putImageData(originalCanvasData.current, 0, 0);
          return;
      }
      
      const croppedImageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
      canvas.width = cropRect.width;
      canvas.height = cropRect.height;
      ctx.putImageData(croppedImageData, 0, 0);
  };
  
  const handleResetCrop = () => {
    if (originalCanvasData.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = originalCanvasData.current.width;
            canvas.height = originalCanvasData.current.height;
            ctx.putImageData(originalCanvasData.current, 0, 0);
        }
    }
  }

  const handleExtractText = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    setFileError(null);
    setOcrProgress(0);
    setOcrStatus("Preparing for text extraction...");

    try {
      const imageBase64 = canvasRef.current.toDataURL('image/png').split(',')[1];
      
      const updateProgress = (progress: number, status: string) => {
        setOcrProgress(progress);
        setOcrStatus(status);
      };

      const result = await performAdvancedOCR(imageBase64, updateProgress);
      
      // We need to create base64 for each detected image from the original canvas
      const detectedImagesWithData = [];
      if (originalCanvasData.current) {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = originalCanvasData.current.width;
          tempCanvas.height = originalCanvasData.current.height;
          tempCtx?.putImageData(originalCanvasData.current, 0, 0);

          for (const img of result.detectedImages) {
              const cropCanvas = document.createElement('canvas');
              const cropCtx = cropCanvas.getContext('2d');
              const x = (img.x / 100) * tempCanvas.width;
              const y = (img.y / 100) * tempCanvas.height;
              const width = (img.width / 100) * tempCanvas.width;
              const height = (img.height / 100) * tempCanvas.height;
              
              cropCanvas.width = width;
              cropCanvas.height = height;
              cropCtx?.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height);
              
              detectedImagesWithData.push({
                  ...img,
                  base64: cropCanvas.toDataURL('image/png').split(',')[1]
              });
          }
      }

      const newExtraction: ExtractedContent = {
        ...result,
        detectedImages: detectedImagesWithData,
        id: `ext_${Date.now()}`,
        pageNumber: currentPage,
        fileName: selectedFile?.name || 'file',
        fileType: fileType!,
        isQACProcessed: false,
        timestamp: new Date(),
      };

      setExtractions(prev => [newExtraction, ...prev]);
      setActiveExtraction(newExtraction);
      setOcrStatus("Text extraction completed successfully!");
    } catch (error) {
      console.error("Error extracting text:", error);
      const message = error instanceof Error ? error.message : "Failed to extract text.";
      // Check for common API key error
      if (message.includes("API key not valid")) {
          setFileError("API Key is not valid. Please select a valid key.");
          setHasApiKey(false); // Force re-selection
      } else {
          setFileError(message);
      }
      setOcrStatus("Extraction failed");
    } finally {
      setIsProcessing(false);
      handleResetCrop(); // Reset view to full page after extraction
    }
  };
  
  const handlePerformQAC = async () => {
      if (!activeExtraction || !originalCanvasData.current) return;
      setIsQACProcessing(true);

      // We need a base64 of the original, uncropped page for context
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalCanvasData.current.width;
      tempCanvas.height = originalCanvasData.current.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
          setIsQACProcessing(false);
          return;
      }
      tempCtx.putImageData(originalCanvasData.current, 0, 0);
      const imageBase64 = tempCanvas.toDataURL('image/png').split(',')[1];
      
      try {
          const result = await performQAC(activeExtraction.text, imageBase64);
          const updatedExtraction = {
              ...activeExtraction,
              qacText: result.correctedText,
              qacFixes: result.fixes,
              isQACProcessed: true,
          };
          setActiveExtraction(updatedExtraction);
          setExtractions(prev => prev.map(ext => ext.id === activeExtraction.id ? updatedExtraction : ext));
      } catch (error) {
          console.error("Error performing QAC:", error);
          const message = error instanceof Error ? error.message : "Failed to perform QAC.";
          setFileError(message);
      } finally {
          setIsQACProcessing(false);
      }
  };

  const handleImageAction = async (imageId: string, action: 'enhance' | 'base64', colorize: boolean) => {
     if (!activeExtraction?.detectedImages) return;

     const updateImageState = (id: string, updates: Partial<ExtractedContent['detectedImages'][0]>) => {
         setActiveExtraction(prev => {
             if (!prev?.detectedImages) return prev;
             const newImages = prev.detectedImages.map(img => img.id === id ? { ...img, ...updates } : img);
             const newExtraction = { ...prev, detectedImages: newImages };
             setExtractions(p => p.map(e => e.id === prev.id ? newExtraction : e));
             return newExtraction;
         });
     };

     updateImageState(imageId, { isProcessing: true });
     
     const targetImage = activeExtraction.detectedImages.find(img => img.id === imageId);
     if (!targetImage) {
         updateImageState(imageId, { isProcessing: false });
         return;
     }

     try {
        const imageBase64 = targetImage.base64;
        if (action === 'enhance') {
            const resultUrl = await enhanceAndRedrawImage(imageBase64, colorize);
            updateImageState(imageId, { enhancedImageUrl: resultUrl, isProcessing: false });
        } else { // base64
            // The base64 is already there, we just expose it. For this UI, no server action is needed.
            updateImageState(imageId, { isProcessing: false });
        }
     } catch(error) {
        console.error(`Error performing image action ${action}:`, error);
        setFileError(`Failed to ${action} image.`);
        updateImageState(imageId, { isProcessing: false });
     }
  };
  
  const handleColorizeToggle = (id: string, checked: boolean) => {
    setActiveExtraction(prev => {
        if (!prev?.detectedImages) return prev;
        const newImages = prev.detectedImages.map(img => img.id === id ? { ...img, colorize: checked } : img);
        const newExtraction = { ...prev, detectedImages: newImages };
        setExtractions(p => p.map(e => e.id === prev.id ? newExtraction : e));
        return newExtraction;
    });
  };

  if (hasApiKey === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (!hasApiKey) {
    return <ApiKeySelector onKeySelected={checkApiKey} />;
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-200 flex flex-col font-sans">
      <Header />
      <main className="flex-grow w-full max-w-[100rem] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <LeftPanel 
            onFileChange={handleFileChange}
            selectedFile={selectedFile}
            fileType={fileType}
            totalPages={totalPages}
            isLoadingFile={isLoadingFile}
            fileError={fileError}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onExtract={handleExtractText}
            isProcessing={isProcessing}
            ocrProgress={ocrProgress}
            ocrStatus={ocrStatus}
          />
        </div>

        {/* Middle Column */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <MiddlePanel 
            canvasRef={canvasRef}
            selectedFile={selectedFile}
            isLoadingFile={isLoadingFile}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onCrop={handleCrop}
            onResetCrop={handleResetCrop}
            originalCanvasData={originalCanvasData}
          />
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           <RightPanel
            extraction={activeExtraction}
            onPerformQAC={handlePerformQAC}
            isQACProcessing={isQACProcessing}
            extractions={extractions}
            onSelectExtraction={setActiveExtraction}
            onImageAction={handleImageAction}
            onColorizeToggle={handleColorizeToggle}
           />
        </div>
      </main>
    </div>
  );
}

export default App;
