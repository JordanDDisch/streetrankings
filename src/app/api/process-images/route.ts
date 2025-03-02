import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { Template } from "@/types/templates";
import sizeOf from 'image-size';
import path from 'path';
import fs from 'fs/promises';
import { Storage } from '@google-cloud/storage';

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

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const files: File[] = data.getAll('files') as unknown as File[];
  const template: Template = data.get('template') as unknown as Template;

  const { width: templateWidth, height: templateHeight } = getTemplateDimensions(template);

  if (files.length === 0) {
    return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
  }

  const processedImages: string[] = [];

  try {
    // Create assets directory if it doesn't exist
    const assetsDir = path.join(process.cwd(), 'public/assets');

    const storage = new Storage();
    const bucketName = 'street-rankings'; // Replace with your actual bucket name

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Check file type
      const detectedType = await fileTypeFromBuffer(buffer);
      if (!detectedType || !['image/jpeg', 'image/png', 'image/gif'].includes(detectedType.mime)) {
        return NextResponse.json({ message: `Invalid file type for ${file.name}` }, { status: 400 });
      }

      // Check file size (e.g., limit to 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ message: `File too large: ${file.name}` }, { status: 400 });
      }

      // Check image dimensions
      const dimensions = sizeOf(buffer);
      if (dimensions.width! > 4000 || dimensions.height! > 4000) {
        return NextResponse.json({ message: `Image dimensions too large for ${file.name}` }, { status: 400 });
      }

      try {
        const resizedImageBuffer = await sharp(buffer)
          .resize({
            width: templateWidth,
            height: templateHeight,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 1 }
          })
          .jpeg() // Convert to JPEG
          .toBuffer();

        // Save to assets folder
        const fileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.jpg`;

        // Upload to Google Cloud Storage
        await storage.bucket(bucketName).file(fileName).save(resizedImageBuffer, {
          contentType: 'image/jpeg', // Adjust based on your actual file type
          metadata: {
            cacheControl: 'public, max-age=31536000', // Optional: Set cache control
          }
        });

        console.log(fileName)

        processedImages.push(fileName);
      } catch (error) {
        console.error(`Error processing image ${file.name}:`, error);
        return NextResponse.json({ message: `Error processing image ${file.name}` }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error creating directory or saving files:', error);
    return NextResponse.json({ message: 'Error saving images' }, { status: 500 });
  }

  return NextResponse.json(processedImages);
}
