"use client"

import Masonry from 'react-masonry-css'
import { css } from '@/styled-system/css'
import NextImage from 'next/image'

export function MasonryGallery({ images }: { images: string[] }) {
  return (
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
        <div key={image} className={css({
          mb: 4,
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'md'
        })}>
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
  )
}

