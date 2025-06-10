'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { css } from '@/styled-system/css'
import { 
  imageUploadService, 
  uploadPageGalleryImages, 
  uploadAvatarImage, 
  uploadTemplateImages 
} from '@/lib/imageUpload'
import { ImageUploadResponse } from '@/types/images'

/**
 * Example component demonstrating different ways to use the image upload abstraction
 */
export default function ImageUploadExample() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImageUploadResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
      setResult(null)
    }
  }

  // Example 1: Upload with preset (recommended approach)
  const handleUploadWithPreset = async (preset: 'PAGE_GALLERY' | 'AVATAR' | 'TEMPLATE_PROCESSING') => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      let response: ImageUploadResponse

      switch (preset) {
        case 'PAGE_GALLERY':
          response = await uploadPageGalleryImages(selectedFiles)
          break
        case 'AVATAR':
          response = await uploadAvatarImage(selectedFiles[0]) // Avatar takes single file
          break
        case 'TEMPLATE_PROCESSING':
          response = await uploadTemplateImages(selectedFiles)
          break
      }

      setResult(response)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  // Example 2: Upload with custom configuration
  const handleUploadWithCustomConfig = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      const response = await imageUploadService.uploadWithConfig(selectedFiles, {
        resize: {
          width: 800,
          height: 600,
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        },
        quality: 90,
        format: 'webp',
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        generateZip: false,
        filePrefix: 'custom'
      })

      setResult(response)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  // Example 3: Upload with preset + custom overrides
  const handleUploadWithOverrides = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      const response = await imageUploadService.uploadWithPreset(
        selectedFiles, 
        'PAGE_GALLERY',
        {
          quality: 95, // Override the default quality
          filePrefix: 'premium' // Override the default prefix
        }
      )

      setResult(response)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={css({ p: 4, maxWidth: '800px', mx: 'auto' })}>
      <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 4 })}>
        Image Upload Examples
      </h2>

      {/* File Selection */}
      <Field.Root className={css({ mb: 4 })}>
        <Field.Label>Select Images</Field.Label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className={css({ mb: 2 })}
        />
        {selectedFiles.length > 0 && (
          <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
            Selected {selectedFiles.length} file(s)
          </p>
        )}
      </Field.Root>

      {/* Upload Options */}
      <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 })}>
        <Button
          onClick={() => handleUploadWithPreset('PAGE_GALLERY')}
          disabled={uploading || selectedFiles.length === 0}
          variant="outline"
        >
          Page Gallery Upload
        </Button>

        <Button
          onClick={() => handleUploadWithPreset('AVATAR')}
          disabled={uploading || selectedFiles.length === 0}
          variant="outline"
        >
          Avatar Upload
        </Button>

        <Button
          onClick={() => handleUploadWithPreset('TEMPLATE_PROCESSING')}
          disabled={uploading || selectedFiles.length === 0}
          variant="outline"
        >
          Template Processing
        </Button>

        <Button
          onClick={handleUploadWithCustomConfig}
          disabled={uploading || selectedFiles.length === 0}
          variant="outline"
        >
          Custom Config
        </Button>
      </div>

      <Button
        onClick={handleUploadWithOverrides}
        disabled={uploading || selectedFiles.length === 0}
        className={css({ mb: 4, width: 'full' })}
      >
        Preset + Overrides
      </Button>

      {/* Loading State */}
      {uploading && (
        <div className={css({ textAlign: 'center', py: 4 })}>
          <p>Uploading images...</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={css({ 
          border: '1px solid', 
          borderColor: 'gray.200', 
          borderRadius: 'md', 
          p: 4 
        })}>
          <h3 className={css({ fontWeight: 'bold', mb: 2 })}>Upload Results</h3>
          <p>✅ Successful: {result.totalSuccessful}</p>
          <p>❌ Errors: {result.totalErrors}</p>
          
          {result.zipUrl && (
            <p>
              📦 Zip file: <a href={result.zipUrl} target="_blank" rel="noopener noreferrer">
                Download
              </a>
            </p>
          )}

          {result.results.length > 0 && (
            <div className={css({ mt: 3 })}>
              <h4 className={css({ fontWeight: 'medium', mb: 2 })}>Individual Results:</h4>
              {result.results.map((item, index) => (
                <div 
                  key={index} 
                  className={css({ 
                    fontSize: 'sm', 
                    mb: 1,
                    color: item.success ? 'green.600' : 'red.600'
                  })}
                >
                  {item.success ? (
                    <span>
                      ✅ {item.originalName} → <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.fileName}
                      </a>
                    </span>
                  ) : (
                    <span>❌ {item.originalName}: {item.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Usage Documentation */}
      <div className={css({ mt: 6, p: 4, bg: 'gray.50', borderRadius: 'md' })}>
        <h3 className={css({ fontWeight: 'bold', mb: 2 })}>Usage Examples</h3>
        <pre className={css({ fontSize: 'sm', overflow: 'auto' })}>
{`// Method 1: Use preset functions (recommended)
import { uploadPageGalleryImages, uploadAvatarImage } from '@/lib/imageUpload'

const result = await uploadPageGalleryImages(files)
const avatarResult = await uploadAvatarImage(file)

// Method 2: Use service with presets
import { imageUploadService } from '@/lib/imageUpload'

const result = await imageUploadService.uploadWithPreset(files, 'PAGE_GALLERY')

// Method 3: Use custom configuration
const result = await imageUploadService.uploadWithConfig(files, {
  resize: { width: 800, height: 600 },
  quality: 90,
  format: 'webp'
})

// Method 4: Preset with overrides
const result = await imageUploadService.uploadWithPreset(
  files, 
  'PAGE_GALLERY',
  { quality: 95, filePrefix: 'premium' }
)`}
        </pre>
      </div>
    </div>
  )
} 