"use client"

import { useState } from 'react'
import Masonry from 'react-masonry-css'
import { css } from '@/styled-system/css'
import NextImage from 'next/image'
import { Dialog } from '@/components/ui/dialog'
import { X } from 'lucide-react'

export function MasonryGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  console.log(selectedImage)

  return (
    <>
      <Masonry
        breakpointCols={{
          default: 3,
          1100: 2,
          700: 1
        }}
        className={css({
          display: 'flex',
        })}
        columnClassName={css({
          paddingLeft: '16px',
          backgroundClip: 'padding-box'
        })}
      >
        {images.map((image) => (
          <div 
            key={image} 
            className={css({
              mb: 4,
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
              borderRadius: 'md',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              _hover: {
                transform: 'scale(1.02)'
              }
            })}
            onClick={() => setSelectedImage(image)}
          >
            <NextImage 
              src={image} 
              alt="Gallery image" 
              width={0} 
              height={0} 
              sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
              unoptimized={true}
              className={css({
                width: '100%',
                height: 'auto',
                display: 'block'
              })} 
            />
          </div>
        ))}
      </Masonry>

      {/* Ark UI Dialog for full screen image view */}
      <Dialog.Root 
        open={!!selectedImage} 
        onOpenChange={(details) => {
          if (!details.open) {
            setSelectedImage(null)
          }
        }}
      >
        <Dialog.Backdrop 
          className={css({
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          })} 
        />
        <Dialog.Positioner>
          <Dialog.Content
            className={css({
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: '20px',
              maxWidth: '95vw',
              maxHeight: '95vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            })}
          >
            <Dialog.CloseTrigger
              className={css({
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                zIndex: 10,
                _hover: {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              })}
              aria-label="Close"
            >
              <X size={24} />
            </Dialog.CloseTrigger>

            {selectedImage && (
              <div
                className={css({
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                })}
              >
                <NextImage
                  src={selectedImage}
                  alt="Full size image"
                  width={0}
                  height={0}
                  sizes="90vw"
                  unoptimized={true}
                  className={css({
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  })}
                />
              </div>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}

