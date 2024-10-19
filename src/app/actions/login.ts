'use server'
import { redirect } from 'next/navigation'

export async function login() {
  const clientId = process.env.LIGHTROOM_CLIENT_ID;

  redirect(`https://ims-na1.adobelogin.com/ims/authorize?redirect_uri=https://localhost:3000/api/lightroom-callback&client_id=${clientId}&scope=openid,AdobeID,lr_partner_apis,offline_access&response_type=code`);
}
