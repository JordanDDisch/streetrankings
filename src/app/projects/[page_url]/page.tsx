import { getPage } from '@/app/actions/pages'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Page } from '@/types/pages'
import { MasonryGallery } from '@/components/MasonryGallery'
import { getImagesForPage } from '@/app/actions/images'
import { Image } from '@/types/images'
import { validateSession } from '@/lib/auth'
import { css } from '@/styled-system/css'

export default async function PageDetails({ params }: { params: { page_url: string } }) {
  console.log('Page URL:', params.page_url)
  const page: Page | null = await getPage(params.page_url)
  const images: Image[] | undefined = page?.id ? await getImagesForPage(page.id) : undefined
  const session = await validateSession()

  if (!page) {
    notFound()
  }

  return <div>
    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 })}>
      <Heading as="h1" size="4xl" textAlign="center">{page.page_name}</Heading>
      {session && (
        <Link href={`/dashboard/pages/${params.page_url}`}>
          <Button>Edit</Button>
        </Link>
      )}
    </div>
    <div className="mt-4">
      <div dangerouslySetInnerHTML={{ __html: page.page_description }} />
      {images && images.length > 0 && (
        <MasonryGallery images={images.map((image) => image.image_url)} />
      )}
    </div>
  </div>
}