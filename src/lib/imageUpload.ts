import { ImageUploadConfig, ImageUploadResponse, IMAGE_UPLOAD_PRESETS } from '@/types/images';

/**
 * Client-side image upload service
 * Handles uploading images to the server with configurable options
 */
export class ImageUploadService {
  private baseUrl: string;

  constructor(baseUrl = '/api/upload-images') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload images using a preset configuration
   */
  async uploadWithPreset(
    files: File[],
    preset: keyof typeof IMAGE_UPLOAD_PRESETS,
    additionalConfig?: Partial<ImageUploadConfig>
  ): Promise<ImageUploadResponse> {
    return this.upload(files, { preset, config: additionalConfig });
  }

  /**
   * Upload images with custom configuration
   */
  async uploadWithConfig(
    files: File[],
    config: ImageUploadConfig
  ): Promise<ImageUploadResponse> {
    return this.upload(files, { config });
  }

  /**
   * Core upload method
   */
  private async upload(
    files: File[],
    options: { preset?: keyof typeof IMAGE_UPLOAD_PRESETS; config?: Partial<ImageUploadConfig> }
  ): Promise<ImageUploadResponse> {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    const formData = new FormData();
    
    // Add files to form data
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Add configuration
    if (options.preset) {
      formData.append('preset', options.preset);
    }
    
    if (options.config) {
      formData.append('config', JSON.stringify(options.config));
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Validate files before upload
   */
  validateFiles(files: File[], config: ImageUploadConfig): { valid: File[]; errors: string[] } {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      // Check file type
      if (config.allowedMimeTypes && !config.allowedMimeTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
        return;
      }

      // Check file size
      if (config.maxFileSize && file.size > config.maxFileSize) {
        errors.push(`${file.name}: File too large. Max size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  }
}

// Create a default instance
export const imageUploadService = new ImageUploadService();

/**
 * Convenience functions for common upload scenarios
 */

// Upload images for page gallery
export const uploadPageGalleryImages = (files: File[]) =>
  imageUploadService.uploadWithPreset(files, 'PAGE_GALLERY');

// Upload avatar image
export const uploadAvatarImage = (file: File) =>
  imageUploadService.uploadWithPreset([file], 'AVATAR');

// Upload images for template processing
export const uploadTemplateImages = (files: File[]) =>
  imageUploadService.uploadWithPreset(files, 'TEMPLATE_PROCESSING'); 