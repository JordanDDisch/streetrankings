import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const adobeApiKey = process.env.LIGHTROOM_CLIENT_ID;
  const adobeApiSecret = process.env.LIGHTROOM_CLIENT_SECRECT;

  if(code) {
    try {
      const userAccessTokenResponse = await fetch(`https://ims-na1.adobelogin.com/ims/token/v3?grant_type=authorization_code&code=${code}&client_id=${adobeApiKey}&client_secret=${adobeApiSecret}`, {
        method: 'POST'
      })

      if(userAccessTokenResponse.ok && userAccessTokenResponse.status === 200) {
        const userAccessToken = await userAccessTokenResponse.json()
        const token = userAccessToken.access_token
        
        cookies().set('session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7, // One week
          path: '/',
        })
      }
    } catch (error) {
      console.error(error)
    }

    redirect('/')
  }
}
