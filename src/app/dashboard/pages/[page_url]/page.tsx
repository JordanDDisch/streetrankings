import { getPage } from '@/app/actions/pages'
import { Heading } from '@/components/ui/heading'
import { notFound } from 'next/navigation'
import type { Page } from '@/types/pages'

export default async function PageDetails({ params }: { params: { page_url: string } }) {
  console.log('Page URL:', params.page_url)
  const page: Page | null = await getPage(params.page_url)

  if (!page) {
    notFound()
  }

  return <div>
    <Heading as="h1" size="4xl">Page: {page.page_name}</Heading>
    <div className="mt-4">
      <p><strong>URL:</strong> /{page.page_url}</p>
      <p><strong>Description:</strong> {page.page_description}</p>
      <p><strong>Status:</strong> {page.is_active ? 'Active' : 'Inactive'}</p>
      <p><strong>Created:</strong> {new Date(page.created_at).toLocaleDateString()}</p>
      <p><strong>Updated:</strong> {new Date(page.updated_at).toLocaleDateString()}</p>
      {page.gallery && page.gallery.length > 0 && (
        <div>
          <p><strong>Gallery:</strong> {page.gallery.length} items</p>
        </div>
      )}
    </div>
  </div>
}