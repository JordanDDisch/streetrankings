'use server'
import { redirect } from 'next/navigation'

const currentEnv = process.env.NODE_ENV

export async function login() {
  const clientId = process.env.LIGHTROOM_CLIENT_ID;

  redirect(`https://ims-na1.adobelogin.com/ims/authorize?${currentEnv === 'development' ? 'redirect_uri=https://localhost:3000/api/lightroom-callback' : 'https://www.streetrankings.com/api/lightroom-callback'}&client_id=${clientId}&scope=openid,AdobeID,lr_partner_apis,offline_access&response_type=code`);
}
