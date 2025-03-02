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

      const assetsRawText = await assetsRequest.text();
      
      // Strip off the `while (1) {}` part before parsing the JSON
      const assetsJsonResponse = JSON.parse(assetsRawText.replace(/^while\s*\(1\)\s*{\s*}\s*/, ''));  // Removes the prefix
      const assetId = assetsJsonResponse.resources[0].id

      const assetRequest = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/assets/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${userCode}`,
          'X-API-Key': adobeApiKey,
        }
      })

      const assetRawText = await assetRequest.text()

      const assetJsonResponse = JSON.parse(assetRawText.replace(/^while\s*\(1\)\s*{\s*}\s*/, ''));

      const imageRatio = assetJsonResponse.payload.importSource.originalWidth / assetJsonResponse.payload.importSource.originalHeight

      const imageWidth = 800
      const imageHeight = 800 / imageRatio

      const assetResponse = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/assets/${assetId}/renditions/thumbnail2x`, {
        headers: {
          'Authorization': `Bearer ${userCode}`,
          'X-API-Key': adobeApiKey,
          mode: 'cors'
        }
      })

      console.log(assetResponse)

      const imageBlob = await assetResponse.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      // Now you can set this URL as the src of an image element in the DOM
      return { 
        imageUrl, 
        imageWidth, 
        imageHeight 
      };
    }
  } 
}
