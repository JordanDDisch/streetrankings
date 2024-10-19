import { cookies } from 'next/headers'

const adobeApiKey = process.env.LIGHTROOM_CLIENT_ID;

export async function getUserInfo() {
  if (cookies().get('session')?.value && adobeApiKey) {
    const userCode = cookies().get('session')?.value;

    try {
      const userInfoRequest = await fetch(`https://lr.adobe.io/v2/account`, {
        headers: {
          'Authorization': `Bearer ${userCode}`,
          'X-API-Key': adobeApiKey,
        },
      });
      // Get the raw text response
      const rawText = await userInfoRequest.text();
      
      // Strip off the `while (1) {}` part before parsing the JSON
      const jsonResponse = rawText.replace(/^while\s*\(1\)\s*{\s*}\s*/, '');  // Removes the prefix

      // Now parse the cleaned response as JSON
      const userInfo = JSON.parse(jsonResponse);
      return userInfo;
    } catch (error) {
      console.error('Error during fetch:', error);
    }
  }

  return null;
}

export async function getUserCatalog() {
  const userInfo = await getUserInfo()
  if (cookies().get('session')?.value && adobeApiKey) {
    const userCode = cookies().get('session')?.value;

    if(userInfo && adobeApiKey) {
      const catalogRequest = await fetch(`https://lr.adobe.io/v2/catalog`, {
        headers: {
          'Authorization': `Bearer ${userCode}`,
          'X-API-Key': adobeApiKey,
        },
      })

      // Get the raw text response
      const rawText = await catalogRequest.text();
      
      // Strip off the `while (1) {}` part before parsing the JSON
      const jsonResponse = rawText.replace(/^while\s*\(1\)\s*{\s*}\s*/, '');  // Removes the prefix

      const catalogData = JSON.parse(jsonResponse)

      return catalogData
    }
  }
}

export async function getUserAssets() {
  const userCatalog = await getUserCatalog()
  if (cookies().get('session')?.value && adobeApiKey) {
    const userCode = cookies().get('session')?.value;
    const catalogId = userCatalog?.id

    if(userCatalog && adobeApiKey) {
      const assetsRequest = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/assets`, {
        headers: {
          'Authorization': `Bearer ${userCode}`,
          'X-API-Key': adobeApiKey,
        },
      })

      const rawText = await assetsRequest.text();
      
      // Strip off the `while (1) {}` part before parsing the JSON
      const jsonResponse = rawText.replace(/^while\s*\(1\)\s*{\s*}\s*/, '');  // Removes the prefix

      const firstImage = JSON.parse(jsonResponse).resources[0].links["/rels/rendition_type/1280"].href

      const response = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/${firstImage}`, {
        headers: {
          'Authorization': `Bearer ${userCode}`,
          'X-API-Key': adobeApiKey,
        }
      })

      const imageBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to Blob
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' }); // Assuming the image is a JPEG

      // Create a URL for the Blob
      const imageUrl = URL.createObjectURL(blob);

      console.log(imageUrl)

      // Now you can set this URL as the src of an image element in the DOM
      return imageUrl;
    }
  } 
}
