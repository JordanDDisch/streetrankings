import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fileName = url.searchParams.get('file');
  
  if (!fileName) {
    return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  }
  
  try {
    // Extract bucket name and file path from the GCS URL
    // Example URL format: https://storage.googleapis.com/bucket-name/path/to/file.zip
    const bucketName = process.env.GCS_BUCKET_NAME || 'street-rankings';
      
    // Initialize Google Cloud Storage with credentials
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    
    // Get the file contents
    const [fileContents] = await file.download();
    
    // Determine content type
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';
    
    // Return the file as a response
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}