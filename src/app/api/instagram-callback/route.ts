import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server';

async function getInstagramToken({code, clientId, clientSecret, redirectUri}: 
  {code: string, clientId: string, clientSecret: string, redirectUri: string}) {
  try {
    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      // throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const instagramClientId = process.env.INSTAGRAM_CLIENT_ID;
  const instagramSecret = process.env.INSTAGRAM_SECRET;

  if(code && instagramClientId && instagramSecret) {
    const token = await getInstagramToken({code, clientId: instagramClientId, clientSecret: instagramSecret, redirectUri: 'https://localhost:3000/api/instagram-callback'})
    
    cookies().set('instagram-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    })

    redirect('/')
  }
}
