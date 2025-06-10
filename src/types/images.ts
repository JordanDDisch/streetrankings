// Image upload configuration options
export interface ImageUploadConfig {
  // Resize options
  resize?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
    background?: { r: number; g: number; b: number; alpha: number };
  };
  
  // Quality and format options
  quality?: number; // 1-100 for JPEG quality
  format?: 'jpeg' | 'png' | 'webp';
  
  // File validation
  maxFileSize?: number; // in bytes
  maxDimensions?: { width: number; height: number };
  allowedMimeTypes?: readonly string[];
  
  // Storage options
  generateZip?: boolean;
  makePublic?: boolean;
  cacheControl?: string;
  
  // Naming
  filePrefix?: string;
  preserveOriginalName?: boolean;
}

// Default configurations for different use cases
export const IMAGE_UPLOAD_PRESETS = {
  PAGE_GALLERY: {
    resize: {
      width: 1200,
      height: 1200,
      fit: 'contain' as const,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    },
    quality: 85,
    format: 'jpeg' as const,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxDimensions: { width: 4000, height: 4000 },
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
    generateZip: false,
    makePublic: true,
    cacheControl: 'public, max-age=31536000',
    filePrefix: 'gallery'
  },
  
  TEMPLATE_PROCESSING: {
    resize: {
      width: 1080,
      height: 1920,
      fit: 'contain' as const,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    },
    quality: 85,
    format: 'jpeg' as const,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxDimensions: { width: 4000, height: 4000 },
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'] as const,
    generateZip: true,
    makePublic: true,
    cacheControl: 'public, max-age=31536000',
    filePrefix: 'processed'
  },
  
  AVATAR: {
    resize: {
      width: 200,
      height: 200,
      fit: 'cover' as const,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    },
    quality: 90,
    format: 'jpeg' as const,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxDimensions: { width: 2000, height: 2000 },
    allowedMimeTypes: ['image/jpeg', 'image/png'] as const,
    generateZip: false,
    makePublic: true,
    cacheControl: 'public, max-age=31536000',
    filePrefix: 'avatar'
  }
} as const;

// Upload result for individual images
export interface ImageUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  originalName: string;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

// Complete upload response
export interface ImageUploadResponse {
  results: ImageUploadResult[];
  zipUrl?: string;
  zipFileName?: string;
  totalSuccessful: number;
  totalErrors: number;
}

// Request payload for upload API
export interface ImageUploadRequest {
  config?: Partial<ImageUploadConfig>;
  preset?: keyof typeof IMAGE_UPLOAD_PRESETS;
} 