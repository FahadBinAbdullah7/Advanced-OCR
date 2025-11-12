

export interface QACFix {
  original: string
  corrected: string
  type: string
  description: string
}

export interface DetectedImage {
  id: string
  x: number // percentage
  y: number // percentage
  width: number // percentage
  height: number // percentage
  base64: string
  enhancedImageUrl?: string
  isProcessing?: boolean
  description?: string
  colorize?: boolean
}

export interface ExtractedContent {
  id: string;
  text: string
  pageNumber: number
  confidence?: number
  extractionMethod?: string
  fileName: string
  fileType: "pdf" | "image"
  qacText?: string
  qacFixes?: QACFix[]
  isQACProcessed?: boolean
  detectedImages: DetectedImage[]
  // Fix: Add timestamp for history components
  timestamp: Date;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Fix: Add missing AspectRatio type for VideoPanel
export type AspectRatio = '16:9' | '9:16';

// Fix: Add missing ImageFile type for ImageUploader
export interface ImageFile {
  base64: string;
  mimeType: string;
  url: string;
}

// Fix: Add missing FileInfo type for FileUploadPanel
export interface FileInfo {
  name: string;
  size: number;
  totalPages: number;
}

// Fix: Add missing Crop type for PreviewPanel
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: '%';
}
