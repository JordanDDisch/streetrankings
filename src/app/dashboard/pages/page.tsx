import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { getPages } from '@/app/actions/pages'
import { css } from '@/styled-system/css'
import CreatePageForm from '@/components/CreatePageForm'
import type { Page } from '@/types/pages'
import NextImage from 'next/image'

export default async function Pages() {
  const pages: Page[] = await getPages()

  return <div>
    <Heading as="h1" size="4xl" mb={4}>Pages</Heading>

    <div className={css({
      display: 'grid',
      gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
      gap: 4,
      mb: 6
    })}>
      {pages.map((page: Page) => (
        <Link 
          key={page.id} 
          href={`/dashboard/pages/${page.page_url}`}
          className={css({
            display: 'block',
            borderRadius: 'md',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'gray.200',
            transition: 'all 0.2s',
            _hover: {
              borderColor: 'gray.400'
            }
          })}
        >
          {page.hero_image && (
            <div className={css({ 
              position: 'relative', 
              width: '100%', 
              height: '200px',
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
          <div className={css({ p: 3 })}>
            <div className={css({ fontWeight: 'bold', mb: 2 })}>{page.page_name}</div>
            <div 
              className={css({ 
                fontSize: 'sm', 
                color: 'gray.600',
                lineClamp: 2,
                mb: 2,
                '& p': { margin: 0 }
              })} 
              dangerouslySetInnerHTML={{ __html: page.page_description }} 
            />
            <div className={css({ fontSize: "xs", color: "gray.500" })}>
              <span>/{page.page_url}</span>
              {page.is_active ? ( 
                <span className={css({ ml: 2, color: "green.600" })}>• Active</span>
              ) : (
                <span className={css({ ml: 2, color: "red.600" })}>• Inactive</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>

    <div className={css({ mt: 6 })}>
      <Heading as="h2" size="2xl" mb={4}>Create New Page</Heading>
      <CreatePageForm />
    </div>
  </div>
}