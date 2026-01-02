'use client'

import { useState, useEffect } from "react"
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { createPage, updatePage } from "@/app/actions/pages"
import { useRouter } from "next/navigation"
import { Field } from "@/components/ui/field"
import { FileUpload } from "@/components/ui/file-upload"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { FormLabel } from '@/components/ui/form-label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Grip, Trash2Icon } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { css } from "@/styled-system/css"
import { CreatePageFormValues, CreatePageInput } from '@/types/pages'
import { uploadPageGalleryImages } from '@/lib/imageUpload'
import { createImagesForPage } from '@/app/actions/images'

// Validation schema using Yup
const validationSchema = Yup.object({
  page_name: Yup.string()
    .required('Page name is required')
    .min(2, 'Page name must be at least 2 characters')
    .max(100, 'Page name must be less than 100 characters'),
  page_url: Yup.string()
    .required('Page URL is required')
    .matches(/^[a-z0-9-]+$/, 'Page URL can only contain lowercase letters, numbers, and hyphens')
    .min(2, 'Page URL must be at least 2 characters')
    .max(100, 'Page URL must be less than 100 characters'),
  page_description: Yup.string()
    .required('Page description is required')
    .min(10, 'Page description must be at least 10 characters'),
  is_active: Yup.boolean(),
  files: Yup.array().of(Yup.mixed()),
  heroImageFile: Yup.mixed().required('Hero image is required')
})

const CreatePageForm = () => {
  const [files, setFiles] = useState<File[]>([])
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [heroImagePreviewUrl, setHeroImagePreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map())
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Create and cleanup blob URL for hero image
  useEffect(() => {
    if (heroImageFile) {
      const url = URL.createObjectURL(heroImageFile)
      setHeroImagePreviewUrl(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setHeroImagePreviewUrl('')
    }
  }, [heroImageFile])

  // Create and cleanup blob URLs when gallery files change
  useEffect(() => {
    // Revoke old URLs that are no longer needed
    const currentFileNames = new Set(files.map(f => f.name))
    previewUrls.forEach((url, fileName) => {
      if (!currentFileNames.has(fileName)) {
        URL.revokeObjectURL(url)
      }
    })

    // Create new URLs for new files
    const newPreviewUrls = new Map<string, string>()
    files.forEach(file => {
      const existingUrl = previewUrls.get(file.name)
      if (existingUrl) {
        newPreviewUrls.set(file.name, existingUrl)
      } else {
        const url = URL.createObjectURL(file)
        newPreviewUrls.set(file.name, url)
      }
    })
    
    setPreviewUrls(newPreviewUrls)

    // Cleanup on unmount
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  function handleDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over?.id) {
      setFiles((files) => {
        const oldIndex = files.findIndex((file) => file.name === active.id)
        const newIndex = files.findIndex((file) => file.name === over?.id)

        return arrayMove(files, oldIndex, newIndex)
      })
    }
  }

  const generateUrlSlug = (name: string): string => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const initialValues: CreatePageFormValues = {
    page_name: '',
    page_url: '',
    page_description: '',
    is_active: true,
    files: [],
    heroImageFile: null
  }

  const handleSubmit = async (
    values: CreatePageFormValues,
    { setSubmitting, setFieldError }: FormikHelpers<CreatePageFormValues>
  ) => {
    try {
      setIsUploading(true)
      
      // 1. Upload hero image first
      let heroImageUrl = ''
      if (values.heroImageFile) {
        try {
          const heroImageResponse = await uploadPageGalleryImages([values.heroImageFile])
          
          if (heroImageResponse.totalErrors > 0 || heroImageResponse.results.length === 0) {
            setFieldError('heroImageFile', 'Failed to upload hero image. Please try again.')
            return
          }
          
          const successfulUpload = heroImageResponse.results.find((r: any) => r.success && r.url)
          if (!successfulUpload || !successfulUpload.url) {
            setFieldError('heroImageFile', 'Failed to upload hero image. Please try again.')
            return
          }
          
          heroImageUrl = successfulUpload.url
          console.log('Hero image uploaded:', heroImageUrl)
        } catch (heroUploadError) {
          console.error('Hero image upload failed:', heroUploadError)
          setFieldError('heroImageFile', 'Failed to upload hero image. Please try again.')
          return
        }
      }
      
      setIsUploading(false)
      
      // 2. Create page with hero image
      const pageData: CreatePageInput = {
        page_name: values.page_name,
        page_url: values.page_url,
        page_description: values.page_description,
        is_active: values.is_active,
        gallery: [], // Start with empty gallery
        hero_image: heroImageUrl
      }

      console.log('Creating page...', pageData)
      const createdPage = await createPage(pageData)
      console.log('Page created with ID:', createdPage.id)

      // 3. Upload gallery images and create image records (if any files are selected)
      if (files.length > 0) {
        setIsUploading(true)
        
        try {
          const uploadResponse = await uploadPageGalleryImages(files)
          
          if (uploadResponse.totalErrors > 0) {
            console.warn('Some images failed to upload:', uploadResponse.results
              .filter((r: any) => !r.success)
              .map((r: any) => r.error)
            )
          }

          // Only proceed if at least some images uploaded successfully
          const successfulUploads = uploadResponse.results.filter((r: any) => r.success && r.url)
          if (successfulUploads.length === 0) {
            setFieldError('files', 'No images uploaded successfully. Please try again.')
            return
          }

          // Create image records in database with the actual page ID
          const imageRecords = await createImagesForPage(uploadResponse, createdPage.id)
          const galleryImageIds = imageRecords.map((img: any) => img.id)
          
          console.log('Created image records with IDs:', galleryImageIds)

          // Update the page with image IDs in gallery field
          if (galleryImageIds.length > 0) {
            await updatePage(createdPage.id, { gallery: galleryImageIds })
            console.log('Updated page with gallery image IDs:', galleryImageIds)
          }
            
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          setFieldError('files', 'Failed to upload images. Please try again.')
          return
        } finally {
          setIsUploading(false)
        }
      }

      router.push('/dashboard/pages')
      
    } catch (error) {
      console.error('Error creating page:', error)
      setFieldError('page_name', 'Failed to create page. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form>
          <div className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          })}>
            <Field.Root>
              <Field.Label>Page Name</Field.Label>
              <Field.Input
                name="page_name"
                value={values.page_name}
                onChange={(e) => {
                  setFieldValue('page_name', e.target.value)
                  // Auto-generate URL slug when page name changes
                  if (!values.page_url || values.page_url === generateUrlSlug(values.page_name)) {
                    setFieldValue('page_url', generateUrlSlug(e.target.value))
                  }
                }}
                placeholder="Enter page name"
              />
              {errors.page_name && touched.page_name && (
                <Field.ErrorText>{errors.page_name}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>Page URL</Field.Label>
              <Field.Input
                name="page_url"
                value={values.page_url}
                onChange={(e) => {
                  const urlSlug = generateUrlSlug(e.target.value)
                  setFieldValue('page_url', urlSlug)
                }}
                placeholder="page-url-slug"
              />
              {errors.page_url && touched.page_url && (
                <Field.ErrorText>{errors.page_url}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <FormLabel htmlFor="page_description">Description</FormLabel>
              <RichTextEditor
                content={values.page_description}
                onChange={(content) => setFieldValue('page_description', content)}
                placeholder="Enter a description for your page..."
              />
              {errors.page_description && touched.page_description && (
                <Field.ErrorText>{errors.page_description}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <label className={css({ display: 'flex', alignItems: 'center', gap: 2 })}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={values.is_active}
                  onChange={(e) => setFieldValue('is_active', e.target.checked)}
                />
                <span>Page is active</span>
              </label>
            </Field.Root>

            <Field.Root>
              <FormLabel>Hero Image (Required)</FormLabel>
              <FileUpload.Root
                maxFiles={1}
                onFileChange={(details) => {
                  const file = details.acceptedFiles[0] || null
                  setHeroImageFile(file)
                  setFieldValue('heroImageFile', file)
                }}
              >
                <FileUpload.Dropzone>
                  <FileUpload.Label>Drop your hero image here or click to browse</FileUpload.Label>
                  <FileUpload.Trigger asChild>
                    <Button size="sm" type="button">Choose Hero Image</Button>
                  </FileUpload.Trigger>
                </FileUpload.Dropzone>
                {heroImageFile && (
                  <div className={css({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "gray.200",
                    borderRadius: "md",
                    mt: 2
                  })}>
                    <div className={css({
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 2,
                      alignItems: 'center'
                    })}>
                      {heroImagePreviewUrl && (
                        <img 
                          src={heroImagePreviewUrl}
                          alt={heroImageFile.name}
                          className={css({
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: 'sm'
                          })} 
                        />
                      )}
                      <div>
                        <div className={css({ fontWeight: 'medium' })}>{heroImageFile.name}</div>
                        <div className={css({ 
                          fontSize: 'sm', 
                          color: 'gray.600' 
                        })}>
                          {(heroImageFile.size / 1024).toFixed(0)} kB
                        </div>
                      </div>
                    </div>
                    <IconButton 
                      variant="link" 
                      size="sm" 
                      type="button"
                      onClick={() => {
                        setHeroImageFile(null)
                        setFieldValue('heroImageFile', null)
                      }}
                    >
                      <Trash2Icon />
                    </IconButton>
                  </div>
                )}
                <FileUpload.HiddenInput />
              </FileUpload.Root>
              {errors.heroImageFile && touched.heroImageFile && (
                <Field.ErrorText>{String(errors.heroImageFile)}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <FormLabel>Gallery Images (Optional)</FormLabel>
              <FileUpload.Root
                maxFiles={30}
                onFileChange={(details) => {
                  setFiles(details.acceptedFiles)
                  setFieldValue('files', details.acceptedFiles)
                }}
              >
                <FileUpload.Dropzone>
                  <FileUpload.Label>Drop your images here or click to browse</FileUpload.Label>
                  <FileUpload.Trigger asChild>
                    <Button size="sm" type="button">Choose Images</Button>
                  </FileUpload.Trigger>
                </FileUpload.Dropzone>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={files.map((file) => file.name)}
                    strategy={verticalListSortingStrategy}
                  >
                    <FileUpload.ItemGroup>
                      {files.map((file) => {
                        const previewUrl = previewUrls.get(file.name) || ''
                        
                        return (
                          <SortableItem id={file.name} key={file.name}>
                            <FileUpload.Item file={file} className={css({
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 2,
                              p: 2,
                              border: "1px solid",
                              borderColor: "gray.200",
                              borderRadius: "md",
                              mb: 2
                            })}>
                              <div className={css({
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 2,
                                alignItems: 'center'
                              })}>
                                <Grip className={css({
                                  cursor: 'grab',
                                  color: 'gray.500'
                                })} />
                                <div className={css({
                                  display: 'flex',
                                  flexDirection: 'row',
                                  gap: 2,
                                  alignItems: 'center'
                                })}>
                                  {previewUrl && (
                                    <img 
                                      src={previewUrl}
                                      alt={file.name}
                                      className={css({
                                        width: '50px',
                                        height: '50px',
                                        objectFit: 'cover',
                                        borderRadius: 'sm'
                                      })} 
                                    />
                                  )}
                                  <div>
                                    <div className={css({ fontWeight: 'medium' })}>{file.name}</div>
                                    <div className={css({ 
                                      fontSize: 'sm', 
                                      color: 'gray.600' 
                                    })}>
                                      {(file.size / 1024).toFixed(0)} kB
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <IconButton 
                                variant="link" 
                                size="sm" 
                                type="button"
                                onClick={() => {
                                  const newFiles = files.filter(f => f.name !== file.name)
                                  setFiles(newFiles)
                                  setFieldValue('files', newFiles)
                                }}
                              >
                                <Trash2Icon />
                              </IconButton>
                            </FileUpload.Item>
                          </SortableItem>
                        )
                      })}
                    </FileUpload.ItemGroup>
                  </SortableContext>
                </DndContext>
                <FileUpload.HiddenInput />
              </FileUpload.Root>
              {errors.files && touched.files && (
                <Field.ErrorText>{String(errors.files)}</Field.ErrorText>
              )}
            </Field.Root>

            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className={css({ mt: 4 })}
            >
              {isUploading 
                ? 'Uploading Images...' 
                : isSubmitting 
                  ? 'Creating Page...' 
                  : 'Create Page'
              }
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

const SortableItem = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

export default CreatePageForm