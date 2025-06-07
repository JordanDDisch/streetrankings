import { redirect } from 'next/navigation'
import { validateSession } from '@/lib/auth'
import { Heading } from '@/components/ui/heading'
import { Card } from '@/components/ui/card'
import { css } from '@/styled-system/css'

export default async function Dashboard() {
  // Validate session - redirect to login if invalid
  const session = await validateSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className={css({
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      p: 4
    })}>
      <Heading as="h1" size="4xl">
        Dashboard
      </Heading>
      
      <Card.Root>
        <Card.Header>
          <Card.Title>Welcome back! </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          })}>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Username:</strong> {session.user.username}</p>
            {session.user.first_name && (
              <p><strong>Name:</strong> {session.user.first_name} {session.user.last_name}</p>
            )}
            <p><strong>Session expires:</strong> {new Date(session.expires_at).toLocaleString()}</p>
            <p><strong>Last accessed:</strong> {new Date(session.last_accessed_at).toLocaleString()}</p>
          </div>
        </Card.Body>
      </Card.Root>
    </div>
  )
}