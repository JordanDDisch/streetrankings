import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { login } from '@/app/actions/login'
import { css } from '@/styled-system/css';

const LoginForm = () => {
  return <form action={login}>
      <div className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      })}>
        <Link href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=833347475350962&redirect_uri=https://localhost:3000/api/instagram-callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish
  ">Instagram Login</Link>
        <Button type="submit">
          Login via Lightroom
        </Button>
      </div>
    </form>;
};

export default LoginForm;
