import { NextRequest, NextResponse } from 'next/server';
import { Template } from "@/types/templates";
import { ProcessImagesResponse } from '@/types/api';
import { imageUploadService } from '@/lib/imageUpload';
import { IMAGE_UPLOAD_PRESETS } from '@/types/images';

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

  const { 
    width: templateWidth, 
    height: templateHeight 
  } = getTemplateDimensions(template);

  if (files.length === 0) {
    return NextResponse.json({ images: [], errors: ['No files uploaded'], zipFile: null }, { status: 400 });
  }

  try {
    // Use the image upload abstraction with custom configuration based on template
    const customConfig = {
      ...IMAGE_UPLOAD_PRESETS.TEMPLATE_PROCESSING,
      resize: {
        width: templateWidth,
        height: templateHeight,
        fit: 'contain' as const,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    };

    const uploadResponse = await imageUploadService.uploadWithConfig(files, customConfig);

    // Convert to the original API format for backward compatibility
    const images = uploadResponse.results
      .filter(result => result.success && result.url)
      .map(result => result.url!);

    const errors = uploadResponse.results
      .filter(result => !result.success)
      .map(result => `${result.originalName}: ${result.error}`);

    return NextResponse.json({
      images,
      errors: errors.length > 0 ? errors : [],
      zipFile: uploadResponse.zipFileName || null
    });

  } catch (error) {
    console.error('Error processing images:', error);
    return NextResponse.json({ images: [], errors: ['Error processing images'], zipFile: null }, { status: 500 });
  }
}
