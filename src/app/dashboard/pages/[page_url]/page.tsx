'use client'

import { useState, useEffect } from 'react'
import { getPage } from '@/app/actions/pages'
import { getImagesForPage } from '@/app/actions/images'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { css } from '@/styled-system/css'
import EditPageForm from '@/components/EditPageForm'
import type { Page } from '@/types/pages'
import type { Image } from '@/types/images'
import Masonry from 'react-masonry-css'
import NextImage from 'next/image'

export default function PageDetails({ params }: { params: { page_url: string } }) {
  const [page, setPage] = useState<Page | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [images, setImages] = useState<Image[]>([])

  useEffect(() => {
    async function loadPage() {
      console.log('Page URL:', params.page_url)
      const fetchedPage = await getPage(params.page_url)
      setPage(fetchedPage)

      if(fetchedPage?.id) {
        const fetchedImages = await getImagesForPage(fetchedPage?.id)
        setImages(fetchedImages)
      }
      setIsLoading(false)
    }
    loadPage()
  }, [params.page_url])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!page) {
    notFound()
  }

  return <div>
    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 })}>
      <Heading as="h1" size="4xl">Page: {page.page_name}</Heading>
      <Button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? 'View Mode' : 'Edit Mode'}
      </Button>
    </div>

    {isEditing ? (
      <div className={css({ mt: 6 })}>
        <EditPageForm page={page} images={images} />
      </div>
    ) : (
      <div className={css({ mt: 4 })}>
        <div className={css({
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          p: 4,
          border: '1px solid',
          borderColor: 'gray.200',
          borderRadius: 'md'
        })}>
          <div>
            <p className={css({ fontWeight: 'bold', mb: 1 })}>URL:</p>
            <p>/{page.page_url}</p>
          </div>
          <div>
            <p className={css({ fontWeight: 'bold', mb: 1 })}>Description:</p>
            <div dangerouslySetInnerHTML={{ __html: page.page_description }} />
          </div>
          <div>
            <p className={css({ fontWeight: 'bold', mb: 1 })}>Status:</p>
            <p>{page.is_active ? (
              <span className={css({ color: 'green.600' })}>Active</span>
            ) : (
              <span className={css({ color: 'red.600' })}>Inactive</span>
            )}</p>
          </div>
          <div>
            <p className={css({ fontWeight: 'bold', mb: 1 })}>Created:</p>
            <p>{new Date(page.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className={css({ fontWeight: 'bold', mb: 1 })}>Updated:</p>
            <p>{new Date(page.updated_at).toLocaleDateString()}</p>
          </div>
          {page.gallery && page.gallery.length > 0 && (
            <div>
              <p className={css({ fontWeight: 'bold', mb: 1 })}>Gallery:</p>
              <p>{page.gallery.length} items</p>
            </div>
          )}
          {images.length > 0 && (
            <div className={css({ display: 'flex', flexDirection: 'column', gap: 3 })}>
              <p className={css({ fontWeight: 'bold', mb: 1 })}>Images:</p>
              <p>{images.length} items</p>
              <Masonry
                breakpointCols={{
                  default: 3,
                  1100: 2,
                  700: 1
                }}
                className={css({
                  display: 'flex',
                  marginLeft: '-16px',
                  width: 'auto',
                  mb: 3
                })}
                columnClassName={css({
                  paddingLeft: '16px',
                  backgroundClip: 'padding-box'
                })}
              >
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={css({
                      mb: 4,
                      position: 'relative',
                      width: '100%',
                      overflow: 'hidden',
                      borderRadius: 'md'
                    })}
                  >
                    <NextImage 
                      src={image.image_url} 
                      alt={image.image_description || 'Gallery image'}
                      width={0}
                      height={0}
                      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      unoptimized={true}
                      className={css({
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      })}
                      quality={85}
                      priority={false}
                    />
                  </div>
                ))}
              </Masonry>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
}