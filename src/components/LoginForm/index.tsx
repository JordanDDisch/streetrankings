import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/login'
import { css } from '@/styled-system/css';

const LoginForm = () => {
  return <form action={login}>
      <div className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      })}>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Field.Input name="email" type="email" />
          <Field.ErrorText>Error</Field.ErrorText>
        </Field.Root>
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <Field.Input name="password" type="password" />
          <Field.ErrorText>Error</Field.ErrorText>
        </Field.Root>
        <Button type="submit">Login</Button>
      </div>
    </form>;
};

export default LoginForm;
