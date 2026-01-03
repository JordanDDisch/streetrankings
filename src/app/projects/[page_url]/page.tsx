import { getPage } from '@/app/actions/pages'
import { Heading } from '@/components/ui/heading'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Page } from '@/types/pages'
import { MasonryGallery } from '@/components/MasonryGallery'
import { getImagesForPage } from '@/app/actions/images'
import { Image } from '@/types/images'
import { validateSession } from '@/lib/auth'
import { css } from '@/styled-system/css'
import type { Metadata } from 'next'
import NextImage from 'next/image'
import { button } from '@/styled-system/recipes'

export async function generateMetadata({ params }: { params: { page_url: string } }): Promise<Metadata> {
  const page: Page | null = await getPage(params.page_url)

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  // Strip HTML tags from description for meta description
  const plainTextDescription = page.page_description.replace(/<[^>]*>/g, '').substring(0, 160)

  return {
    title: page.page_name,
    description: plainTextDescription,
    keywords: page.keywords || '',
    openGraph: {
      title: page.page_name,
      description: plainTextDescription,
      images: [
        {
          url: 'https://jordan-disch.com/assets/images/IMG_6101.jpg',
          alt: 'Jordan Disch - Street Rankings',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.page_name,
      description: plainTextDescription,
      images: ['https://jordan-disch.com/assets/images/IMG_6101.jpg'],
    },
  }
}

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
        <Link href={`/dashboard/pages/${params.page_url}`} className={button()}>
          Edit
        </Link>
      )}
    </div>
    <div className="mt-4">
      {page.hero_image && (
        <div className={css({ mb: 6, position: 'relative', width: '100%', height: { base: '300px', md: '500px' }, borderRadius: 'lg', overflow: 'hidden' })}>
          <NextImage 
            src={page.hero_image} 
            alt={page.page_name}
            fill
            unoptimized={true}
            priority
            className={css({
              objectFit: 'cover'
            })}
          />
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: page.page_description }} />
      {images && images.length > 0 && (
        <MasonryGallery images={images.map((image) => image.image_url)} />
      )}
    </div>
  </div>
}