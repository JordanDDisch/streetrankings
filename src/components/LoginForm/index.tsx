import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/login'

const LoginForm = () => {
  return <form action={login}>
      <Button type="submit">
        Login via Lightroom
      </Button>
    </form>;
};

export default LoginForm;
