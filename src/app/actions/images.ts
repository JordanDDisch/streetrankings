'use server'
import db from '@/lib/db'
import { ImageUploadResponse } from '@/types/images'
import { NextResponse } from 'next/server'

export async function createImagesForPage(images: ImageUploadResponse, page_id: string) {
  const imageRecords = []
  
  for (const image of images.results) {
    if (image.success && image.url) {
      const [imageData] = await db('images').insert({
        image_url: image.url, 
        image_description: image.originalName,
        image_alt: image.originalName,
        image_caption: image.originalName,
        page_id: page_id
      }).returning('*')
      
      imageRecords.push(imageData)
    }
  }

  return imageRecords
}

export async function updateImagesPageId(imageIds: string[], pageId: string) {
  await db('images')
    .whereIn('id', imageIds)
    .update({ page_id: pageId })
}