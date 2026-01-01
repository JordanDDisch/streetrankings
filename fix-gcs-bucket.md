# Fix GCS Bucket 503 Errors

## Problem
Images are returning 503 errors because the GCS bucket doesn't have proper public access configured.

## Solution

### 1. Apply Terraform Changes

First, apply the updated Terraform configuration to add public read access to the bucket:

```bash
cd terraform-gcp
terraform plan
terraform apply
```

This will:
- Enable uniform bucket-level access
- Add CORS configuration for your domain
- Grant `roles/storage.objectViewer` to `allUsers` (making all objects publicly readable)

### 2. Verify Bucket Configuration

After applying, verify the bucket is configured correctly:

```bash
# Check bucket IAM policy
gsutil iam get gs://street-rankings

# You should see something like:
# {
#   "bindings": [
#     {
#       "members": [
#         "allUsers"
#       ],
#       "role": "roles/storage.objectViewer"
#     }
#   ]
# }
```

### 3. Test Image Access

Try accessing one of your image URLs directly in a browser:
```
https://storage.googleapis.com/street-rankings/[your-image-filename]
```

If it still doesn't work, check:
1. The bucket name is correct (`street-rankings`)
2. The image file exists in the bucket
3. The IAM policy was applied successfully

### 4. Alternative: Manual Fix via GCP Console

If Terraform fails due to the `prevent_destroy` lifecycle rule, you can manually configure via GCP Console:

1. Go to [GCP Console > Cloud Storage](https://console.cloud.google.com/storage)
2. Click on the `street-rankings` bucket
3. Go to the "Permissions" tab
4. Click "Grant Access"
5. Add:
   - Principal: `allUsers`
   - Role: `Storage Object Viewer`
6. Save

### 5. Alternative: Using gcloud CLI

```bash
# Grant public read access
gsutil iam ch allUsers:objectViewer gs://street-rankings

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://street-rankings

# Set CORS configuration (allows access from any origin)
cat > cors.json <<EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["*"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://street-rankings
rm cors.json
```

## Why This Works

1. **Uniform Bucket-Level Access**: Simplifies permissions by managing access at the bucket level rather than per-object
2. **Public IAM Binding**: Grants read access to all users (allUsers) for all objects in the bucket
3. **CORS Configuration**: Allows your web app to load images from the GCS domain
4. **Removed Individual makePublic() Calls**: With bucket-level access, individual file permissions are unnecessary

## Image Accessibility

### Who Can Access Your Images?

With this configuration, your images are **publicly accessible from anywhere**:

✅ Direct URL access from any browser  
✅ Embedded in `<img>` tags on ANY website (not just streetrankings.com)  
✅ Via curl, wget, or any HTTP client  
✅ In mobile apps or other applications  
✅ JavaScript fetch/XHR from any domain  

### What Does CORS Control?

The CORS configuration (`origin: ["*"]`) **only affects browser-based JavaScript requests** (fetch, XHR, etc.). It does NOT restrict:
- Direct image loading via `<img>`, `<video>`, `<picture>` tags
- Direct URL access in the browser address bar
- Server-side requests
- Command-line tools (curl, wget)

**Bottom line**: Your images are fully public and can be accessed/embedded anywhere on the internet.

## Security Note

This configuration makes all objects in the bucket publicly readable. This is appropriate for a public image gallery. If you need to store private files, use a separate bucket with different IAM policies.

## Troubleshooting

If images still 503:

1. **Check bucket exists**: `gsutil ls gs://street-rankings`
2. **Check file exists**: `gsutil ls gs://street-rankings/[filename]`
3. **Check IAM policy**: `gsutil iam get gs://street-rankings`
4. **Check service account permissions**: Ensure the compute service account has `Storage Object Admin` role
5. **Check application logs** for upload errors

## Deploy Updated Code

After fixing the bucket permissions, deploy the updated application code:

```bash
git add .
git commit -m "Fix GCS bucket permissions for public image access"
git push
```

The GitHub Actions workflow will deploy the changes automatically.

