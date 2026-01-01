import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { getPages } from '@/app/actions/pages'
import { css } from '@/styled-system/css'
import CreatePageForm from '@/components/CreatePageForm'
import type { Page } from '@/types/pages'

export default async function Pages() {
  const pages: Page[] = await getPages()

  return <div>
    <Heading as="h1" size="4xl" mb={4}>Pages</Heading>

    {pages.map((page: Page) => <div key={page.id} className={css({
      display: "flex",
      flexDirection: "column",
      gap: 2,
      p: 3,
      border: "1px solid",
      borderColor: "gray.200",
      borderRadius: "md",
      mb: 2
    })}>
      <Link href={`/dashboard/pages/${page.page_url}`}>
        <strong>{page.page_name}</strong>
      </Link>
      <div dangerouslySetInnerHTML={{ __html: page.page_description }} />
      <div className={css({ fontSize: "sm", color: "gray.600" })}>
        <span>URL: /{page.page_url}</span>
        {page.is_active ? ( 
          <span className={css({ ml: 2, color: "green.600" })}>• Active</span>
        ) : (
          <span className={css({ ml: 2, color: "red.600" })}>• Inactive</span>
        )}
      </div>
    </div>)}

    <div className={css({ mt: 6 })}>
      <Heading as="h2" size="2xl" mb={4}>Create New Page</Heading>
      <CreatePageForm />
    </div>
  </div>
}