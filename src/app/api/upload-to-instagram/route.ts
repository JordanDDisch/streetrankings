import { NextRequest } from "next/server"
import { getInstagramUser } from "@/app/actions/instagram-session"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const sessionToken = cookies().get('instagram-session')?.value
  const instagramUser = await getInstagramUser()
  const image = await req.json()

  if(!instagramUser || !sessionToken) {
    return new Response(JSON.stringify({error: "No user found"}), {status: 401})
  }

  const response = await fetch(`https://graph.instagram.com/v21.0/${instagramUser.user_id}/media?fields=id,media_url,username&access_token=${sessionToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "image_url": image
    })
  })

  if(!response.ok) {
    console.log(await response.text())
    return new Response(JSON.stringify({error: "Failed to upload to Instagram"}), {status: 500})
  }

  const data = await response.json()

  return new Response(JSON.stringify({success: true, data}), {status: 200})
}