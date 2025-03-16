import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { Template } from "@/types/templates";
import sizeOf from 'image-size';
import { Storage } from '@google-cloud/storage';
import { ProcessImagesResponse } from '@/types/api';
import JSZip from 'jszip';

const getTemplateDimensions = (template: Template): { width: number, height: number } => {
  switch(template) {
    case Template.STORY:
      return { width: 1080, height: 1920 };
    case Template.POST:
      return { width: 1080, height: 1350 };
    default:
      return { width: 1080, height: 1920 };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ProcessImagesResponse>> {
  const data = await req.formData();
  const files: File[] = data.getAll('files') as unknown as File[];
  const template: Template = data.get('template') as unknown as Template;

  const { width: templateWidth, height: templateHeight } = getTemplateDimensions(template);

  if (files.length === 0) {
    return NextResponse.json({ images: [], errors: ['No files uploaded'], zipFile: null }, { status: 400 });
  }

  try {
    const storage = new Storage();
    const bucketName = process.env.GCS_BUCKET_NAME || '';
    const zip = new JSZip();

    // Process all files in parallel
    const processPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Check file type
      const detectedType = await fileTypeFromBuffer(buffer);
      if (!detectedType || !['image/jpeg', 'image/png', 'image/gif'].includes(detectedType.mime)) {
        throw new Error(`Invalid file type for ${file.name}`);
      }

      // Check file size (e.g., limit to 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error(`File too large: ${file.name}`);
      }

      // Check image dimensions
      const dimensions = sizeOf(buffer);
      if (dimensions.width! > 4000 || dimensions.height! > 4000) {
        throw new Error(`Image dimensions too large for ${file.name}`);
      }

      const resizedImageBuffer = await sharp(buffer)
        .resize({
          width: templateWidth,
          height: templateHeight,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .jpeg({ quality: 85 }) // Convert to JPEG with slightly reduced quality for better performance
        .toBuffer();

      // Save to assets folder
      const fileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.jpg`;

      // Add the file to the zip
      zip.file(fileName, resizedImageBuffer);

      // Upload to Google Cloud Storage
      await storage.bucket(bucketName).file(fileName).save(resizedImageBuffer, {
        contentType: 'image/jpeg',
        metadata: {
          cacheControl: 'public, max-age=31536000',
        }
      });
      
      // Make the file publicly accessible
      await storage.bucket(bucketName).file(fileName).makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      console.log(`File uploaded and available at: ${publicUrl}`);

      return publicUrl;
    });

    // Wait for all processing to complete
    const results = await Promise.allSettled(processPromises);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFileName = `zip-${Date.now()}.zip`;

    // Save the zip file to the bucket
    await storage.bucket(bucketName).file(zipFileName).save(zipBuffer, {
      contentType: 'application/zip',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      }
    });
    
    // Handle results and errors
    const processedImages: string[] = [];
    const errors: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processedImages.push(result.value);
      } else {
        console.error(`Error processing image ${files[index].name}:`, result.reason);
        errors.push(`${files[index].name}: ${result.reason.message}`);
      }
    });

    if (errors.length > 0 && processedImages.length === 0) {
      return NextResponse.json({ images: [], errors: ['Failed to process any images'], zipFile: null }, { status: 500 });
    }

    return NextResponse.json({ 
      images: processedImages,
      errors: errors.length > 0 ? errors : [],
      zipFile: zipFileName
    });
  } catch (error) {
    console.error('Error processing images:', error);
    return NextResponse.json({ images: [], errors: ['Error processing images'], zipFile: null }, { status: 500 });
  }
}
