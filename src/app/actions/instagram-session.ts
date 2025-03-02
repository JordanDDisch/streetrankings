import { cookies } from 'next/headers'

async function getUserInfo({accessToken}: {accessToken: string}): Promise<{user_id: string, username: string}> {
  const response = await fetch(`https://graph.instagram.com/v21.0/me?fields=user_id,username&access_token=${accessToken}`)

  if (!response.ok) {
    // throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function getInstagramUser(): Promise<{user_id: string, username: string} | null> {
  const sessionToken = cookies().get('instagram-session')?.value

  console.log(sessionToken)

  if(sessionToken) {
    const userInfo = await getUserInfo({accessToken: sessionToken})

    return userInfo
  }

  return null
}

export async function postProcessImages({image}: {image: string}) {
  const sessionToken = cookies().get('instagram-session')?.value
  const instagramUser = await getInstagramUser()

  if(!instagramUser || !sessionToken) {
    return {error: "No user found"}
  }

  fetch(`https://graph.instagram.com/v21.0/${instagramUser.user_id}/media?fields=id,media_url,username&access_token=${sessionToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "image_url": image
    })
  })
}