'use client'
import { useState } from 'react'
import { redirect } from 'next/navigation'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { css } from '@/styled-system/css';
import { login } from '@/app/actions/login';

const Login = () => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return <div className={css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  })}> 
    <Card.Root width="sm">
      <Card.Header>
        <Card.Title>Login</Card.Title>
      </Card.Header>
      <Card.Body>
        <form action={async (formData) => {
          setIsLoading(true)
          const result = await login(formData)
            if (result.success) {
              redirect('/dashboard')
            } else {
              setError(result.error || 'An error occurred')
            }
            setIsLoading(false)
          }}
        >
          <div className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          })}>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Field.Input name="email" type="email" />
              <Field.ErrorText></Field.ErrorText>
            </Field.Root>
            <Field.Root>
              <Field.Label>Password</Field.Label>
              <Field.Input name="password" type="password" />
              <Field.ErrorText>Error</Field.ErrorText>
            </Field.Root>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Login'}
            </Button>
          </div>
        </form>
        {error && <p className={css({ 
          backgroundColor: 'red', 
          color: 'white', 
          p: 2, 
          borderRadius: 'md', 
          textAlign: 'center',
          mt: 2,
          fontSize: 'sm',
          fontWeight: 'bold',
        })}>{error}</p>}
      </Card.Body>
    </Card.Root>
  </div>;
};

export default Login;
