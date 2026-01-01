'use server'
import db from '@/lib/db'
import { CreatePageInput, Page } from '@/types/pages'

export async function getPages(): Promise<Page[]> {
  const pages = await db('pages').select('*').orderBy('created_at', 'desc')
  return pages
}

export async function createPage(pageData: CreatePageInput): Promise<Page> {
  const [page] = await db('pages').insert({
    page_name: pageData.page_name,
    page_url: pageData.page_url,
    page_description: pageData.page_description,
    is_active: pageData.is_active ?? true,
    gallery: pageData.gallery ?? [],
    hero_image: pageData.hero_image ?? null
  }).returning('*')

  return page
}

export async function getPage(pageUrl: string): Promise<Page | null> {
  const page = await db('pages').where('page_url', pageUrl).first()
  return page || null
}

export async function updatePage(pageId: string, pageData: Partial<CreatePageInput>): Promise<Page> {
  const [page] = await db('pages')
    .where('id', pageId)
    .update({
      ...pageData,
      updated_at: new Date()
    })
    .returning('*')

  return page
}

export async function deletePage(pageId: string): Promise<void> {
  await db('pages').where('id', pageId).del()
}