import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import sizeOf from 'image-size';
import { Storage } from '@google-cloud/storage';
import JSZip from 'jszip';
import { 
  ImageUploadConfig, 
  ImageUploadResponse, 
  ImageUploadResult,
  IMAGE_UPLOAD_PRESETS 
} from '@/types/images';

/**
 * Generic image upload API route
 * Supports different presets and custom configurations
 */
export async function POST(req: NextRequest): Promise<NextResponse<ImageUploadResponse>> {
  try {
    const data = await req.formData();
    const files: File[] = data.getAll('files') as File[];
    const presetName = data.get('preset') as keyof typeof IMAGE_UPLOAD_PRESETS | null;
    const customConfigStr = data.get('config') as string | null;

    if (files.length === 0) {
      return NextResponse.json({
        results: [],
        totalSuccessful: 0,
        totalErrors: 1
      }, { status: 400 });
    }

    // Determine configuration
    let config: ImageUploadConfig;
    
    if (presetName && IMAGE_UPLOAD_PRESETS[presetName]) {
      config = { ...IMAGE_UPLOAD_PRESETS[presetName] };
      
      // Merge with custom config if provided
      if (customConfigStr) {
        try {
          const customConfig = JSON.parse(customConfigStr);
          config = { ...config, ...customConfig };
        } catch (error) {
          console.warn('Failed to parse custom config:', error);
        }
      }
    } else if (customConfigStr) {
      try {
        config = JSON.parse(customConfigStr);
      } catch (error) {
        return NextResponse.json({
          results: [],
          totalSuccessful: 0,
          totalErrors: 1
        }, { status: 400 });
      }
    } else {
      // Default to PAGE_GALLERY preset
      config = { ...IMAGE_UPLOAD_PRESETS.PAGE_GALLERY };
    }

    const storage = new Storage();
    const bucketName = process.env.GCS_BUCKET_NAME || 'street-rankings';
    const zip = config.generateZip ? new JSZip() : null;

    // Process all files in parallel
    const processPromises = files.map(async (file): Promise<ImageUploadResult> => {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(new Uint8Array(bytes));

        // Validate file type
        const detectedType = await fileTypeFromBuffer(buffer);
        if (!detectedType || (config.allowedMimeTypes && !config.allowedMimeTypes.includes(detectedType.mime))) {
          throw new Error(`Invalid file type. Allowed types: ${config.allowedMimeTypes?.join(', ') || 'any'}`);
        }

        // Validate file size
        if (config.maxFileSize && buffer.length > config.maxFileSize) {
          throw new Error(`File too large. Max size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
        }

        // Get original dimensions
        const originalDimensions = sizeOf(buffer as Buffer);
        if (!originalDimensions.width || !originalDimensions.height) {
          throw new Error('Could not determine image dimensions');
        }

        // Validate dimensions
        if (config.maxDimensions) {
          if (originalDimensions.width > config.maxDimensions.width || 
              originalDimensions.height > config.maxDimensions.height) {
            throw new Error(`Image dimensions too large. Max: ${config.maxDimensions.width}x${config.maxDimensions.height}`);
          }
        }

        // Process image
        let processedBuffer = buffer;
        let finalWidth = originalDimensions.width;
        let finalHeight = originalDimensions.height;

        if (config.resize || config.format || config.quality) {
          let sharpInstance = sharp(buffer);

          // Apply resize if configured
          if (config.resize) {
            sharpInstance = sharpInstance.resize({
              width: config.resize.width,
              height: config.resize.height,
              fit: config.resize.fit || 'contain',
              background: config.resize.background || { r: 255, g: 255, b: 255, alpha: 1 }
            });

            finalWidth = config.resize.width || originalDimensions.width;
            finalHeight = config.resize.height || originalDimensions.height;
          }

          // Apply format and quality
          const format = config.format || 'jpeg';
          const quality = config.quality || 85;

          switch (format) {
            case 'jpeg':
              sharpInstance = sharpInstance.jpeg({ quality });
              break;
            case 'png':
              sharpInstance = sharpInstance.png({ quality });
              break;
            case 'webp':
              sharpInstance = sharpInstance.webp({ quality });
              break;
          }

          processedBuffer = await sharpInstance.toBuffer();
        }

        // Generate filename
        const timestamp = Date.now();
        const baseName = config.preserveOriginalName 
          ? file.name.replace(/\.[^/.]+$/, '') 
          : `${timestamp}`;
        const prefix = config.filePrefix ? `${config.filePrefix}-` : '';
        const extension = config.format || 'jpg';
        const fileName = `${prefix}${baseName}.${extension}`;

        // Add to zip if enabled
        if (zip) {
          zip.file(fileName, processedBuffer);
        }

        // Upload to Google Cloud Storage
        const fileRef = storage.bucket(bucketName).file(fileName);
        await fileRef.save(processedBuffer, {
          contentType: `image/${config.format || 'jpeg'}`,
          metadata: {
            cacheControl: config.cacheControl || 'public, max-age=31536000',
          }
        });

        // Make public if configured
        if (config.makePublic !== false) {
          await fileRef.makePublic();
        }

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

        return {
          success: true,
          url: publicUrl,
          fileName,
          originalName: file.name,
          metadata: {
            width: finalWidth,
            height: finalHeight,
            size: processedBuffer.length,
            format: config.format || 'jpeg'
          }
        };

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        return {
          success: false,
          originalName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Wait for all processing to complete
    const results = await Promise.all(processPromises);

    // Handle zip file creation
    let zipUrl: string | undefined;
    let zipFileName: string | undefined;

    if (zip && results.some(r => r.success)) {
      try {
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        zipFileName = `${config.filePrefix || 'images'}-${Date.now()}.zip`;
        
        const zipFileRef = storage.bucket(bucketName).file(zipFileName);
        await zipFileRef.save(zipBuffer, {
          contentType: 'application/zip',
          metadata: {
            cacheControl: config.cacheControl || 'public, max-age=31536000',
          }
        });

        if (config.makePublic !== false) {
          await zipFileRef.makePublic();
        }

        zipUrl = `https://storage.googleapis.com/${bucketName}/${zipFileName}`;
      } catch (error) {
        console.error('Error creating zip file:', error);
      }
    }

    const totalSuccessful = results.filter(r => r.success).length;
    const totalErrors = results.filter(r => !r.success).length;

    return NextResponse.json({
      results,
      zipUrl,
      zipFileName,
      totalSuccessful,
      totalErrors
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({
      results: [],
      totalSuccessful: 0,
      totalErrors: 1
    }, { status: 500 });
  }
} 