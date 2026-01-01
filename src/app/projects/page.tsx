import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { getPages } from '@/app/actions/pages'
import { css } from '@/styled-system/css'
import type { Page } from '@/types/pages'
import NextImage from 'next/image'

export default async function Pages() {
  const pages: Page[] = await getPages()
  const activePages = pages.filter((page) => page.is_active)

  return <div>
    <Heading as="h1" size="4xl" mb={6}>Projects</Heading>

    <div className={css({
      display: 'grid',
      gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
      gap: 6,
      mb: 8
    })}>
      {activePages.map((page: Page) => (
        <Link 
          key={page.id} 
          href={`/projects/${page.page_url}`}
          className={css({
            display: 'block',
            borderRadius: 'lg',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'gray.200',
            transition: 'all 0.2s',
            _hover: {
              transform: 'translateY(-4px)',
              boxShadow: 'lg',
              borderColor: 'gray.300'
            }
          })}
        >
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
            <Heading as="h3" size="xl" mb={2}>{page.page_name}</Heading>
            <div 
              className={css({ 
                fontSize: 'sm', 
                color: 'gray.600',
                lineClamp: 3,
                '& p': { margin: 0 }
              })} 
              dangerouslySetInnerHTML={{ __html: page.page_description }} 
            />
          </div>
        </Link>
      ))}
    </div>

    {activePages.length === 0 && (
      <div className={css({ textAlign: 'center', py: 8, color: 'gray.500' })}>
        No projects available yet.
      </div>
    )}
  </div>
}