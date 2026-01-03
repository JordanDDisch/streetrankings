"use client"

import { useState, useEffect } from 'react'
import Masonry from 'react-masonry-css'
import { css } from '@/styled-system/css'
import NextImage from 'next/image'
import { Dialog } from '@/components/ui/dialog'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export function MasonryGallery({ images }: { images: string[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const isOpen = currentImageIndex !== null

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const goToNext = () => {
    if (currentImageIndex !== null && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentImageIndex !== null && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const handleClose = () => {
    setCurrentImageIndex(null)
  }

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentImageIndex])

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
        {images.map((image, index) => (
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
            onClick={() => setCurrentImageIndex(index)}
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

      {/* Ark UI Dialog for slideshow gallery */}
      <Dialog.Root 
        open={isOpen} 
        onOpenChange={(details) => {
          if (!details.open) {
            handleClose()
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
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
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

            {currentImageIndex !== null && (
              <>
                {/* Image counter */}
                <div
                  className={css({
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'medium',
                    zIndex: 10
                  })}
                >
                  {currentImageIndex + 1} / {images.length}
                </div>

                {/* Previous button */}
                {currentImageIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className={css({
                      position: 'absolute',
                      left: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
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
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={32} />
                  </button>
                )}

                {/* Next button */}
                {currentImageIndex < images.length - 1 && (
                  <button
                    onClick={goToNext}
                    className={css({
                      position: 'absolute',
                      right: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
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
                    aria-label="Next image"
                  >
                    <ChevronRight size={32} />
                  </button>
                )}

                {/* Image display */}
                <div
                  className={css({
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'pan-y pinch-zoom'
                  })}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <NextImage
                    src={images[currentImageIndex]}
                    alt={`Gallery image ${currentImageIndex + 1}`}
                    width={0}
                    height={0}
                    sizes="90vw"
                    unoptimized={true}
                    className={css({
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      userSelect: 'none'
                    })}
                  />
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}

