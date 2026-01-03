import { Heading } from "@/components/ui/heading";
import Link from "next/link";
import { css } from "@/styled-system/css"
import { getPages } from '@/app/actions/pages'
import type { Page } from '@/types/pages'
import NextImage from 'next/image'
import './globals.css';
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { page_url: string } }): Promise<Metadata> {

  return {
    title: 'Jordan Disch - Photographer, Musician, and Software Engineer',
    description: 'Hi, I\'m Jordan. I\'m a software engineer, musician, and photographer. This is my portfolio website of my photography projects. I shoot street photography, urban landscapes, and street art. The photos are a mix of digital and film.',
    openGraph: {
      title: "Jordan D Disch - Street Rankings - Photographer, Musician, and Software Engineer",
      description: 'Hi, I\'m Jordan. I\'m a software engineer, musician, and photographer. This is my portfolio website of my photography projects.',
      images: ['/assets/images/jordan-disch.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Jordan Disch - Photographer, Musician, and Software Engineer',
      description: 'Hi, I\'m Jordan. I\'m a software engineer, musician, and photographer. This is my portfolio website of my photography projects. I shoot street photography, urban landscapes, and street art. The photos are a mix of digital and film.',
      images: ['/assets/images/jordan-disch.jpg'],
    },
  }
}

export default async function Page() {
  const allPages: Page[] = await getPages()
  // Filter to show only active pages on the homepage
  const activePages = allPages.filter(page => page.is_active)

  return (
    <div>
      <div>
        <Heading as="h1" size="4xl" mb={2}>
          Jordan Disch - Photographer, Musician, and Software Engineer
        </Heading>
        <div className={css({ display: 'flex', alignItems: 'center', gap: 8, my: 4 })}>
          <NextImage src="/assets/images/jordan-disch.jpg" alt="Jordan Disch" width={100} height={100} className={css({ borderRadius: 'full' })} />
          <p className={css({ fontSize: 'lg', color: 'gray.600' })}>
            Hi, I&#39;m Jordan. I&#39;m a photographer, musician, and software engineer. This is my portfolio website of my photography projects. I shoot street photography, urban landscapes, and street art. The photos are a mix of digital and film.
          </p>
        </div>
      </div>
      
      <Heading as="h2" size="2xl" mb={2}>Projects</Heading>
      <p className={css({ fontSize: 'lg', color: 'gray.600' })}>
        Here are some of my photography projects.
      </p>
      {activePages.length === 0 ? (
        <div className={css({ 
          textAlign: 'center', 
          color: 'gray.500' 
        })}>
          <p>No gallery pages available yet. Check back soon!</p>
        </div>
      ) : (
        <div className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 6,
        })}>
          {activePages.map((page: Page) => (
            <article 
              key={page.id}
              className={css({
                position: 'relative',
                display: 'block',
                borderRadius: 'lg',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'gray.200',
                transition: 'all 0.2s',
                boxShadow: 'sm',
                _hover: {
                  borderColor: 'gray.400',
                  boxShadow: 'md',
                  transform: 'translateY(-2px)'
                }
              })}
            >
              <Link 
                href={`/projects/${page.page_url}`}
                className={css({
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1
                })}
                aria-label={`View ${page.page_name}`}
              />
              {page.hero_image && (
                <div className={css({ 
                  position: 'relative', 
                  width: '100%', 
                  height: '250px',
                  backgroundColor: 'gray.100'
                })}>
                  <NextImage 
                    src={page.hero_image} 
                    alt={page.page_name}
                    fill
                    unoptimized={true}
                    className={css({
                      objectFit: 'cover'
                    })}
                  />
                </div>
              )}
              <div className={css({ p: 4 })}>
                <Heading 
                  as="h2" 
                  size="xl" 
                  mb={2}
                  className={css({
                    color: 'gray.900'
                  })}
                >
                  {page.page_name}
                </Heading>
                <div 
                  className={css({ 
                    fontSize: 'sm', 
                    color: 'gray.600',
                    lineClamp: 3,
                    '& p': { margin: 0 },
                    '& *': { fontSize: 'inherit' }
                  })} 
                  dangerouslySetInnerHTML={{ __html: page.page_description }} 
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
