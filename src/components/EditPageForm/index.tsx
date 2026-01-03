'use client'

import { useState } from "react"
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { updatePage } from "@/app/actions/pages"
import { useRouter } from "next/navigation"
import { Field } from "@/components/ui/field"
import { FileUpload } from "@/components/ui/file-upload"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { FormLabel } from '@/components/ui/form-label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Grip, Trash2Icon } from "lucide-react"
import Masonry from 'react-masonry-css'
import NextImage from 'next/image'
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
import { Page, CreatePageInput } from '@/types/pages'
import { uploadPageGalleryImages } from '@/lib/imageUpload'
import { createImagesForPage, deleteImagesForPage } from '@/app/actions/images'
import { Image } from '@/types/images'
import { toast } from "@/styled-system/recipes"

interface EditPageFormValues {
  page_name: string
  page_url: string
  page_description: string
  is_active: boolean
  sort_order: number
  files: File[]
  heroImageFile: File | null
  keywords: string
}

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
  sort_order: Yup.number()
    .required('Sort order is required')
    .integer('Sort order must be a whole number')
    .min(0, 'Sort order must be 0 or greater'),
  keywords: Yup.string()
    .max(500, 'Keywords must be less than 500 characters'),
  files: Yup.array().of(Yup.mixed()),
  heroImageFile: Yup.mixed().nullable()
})

interface EditPageFormProps {
  page: Page
  images: Image[]
}

const EditPageForm = ({ page, images }: EditPageFormProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [existingImages, setExistingImages] = useState<Image[]>(images)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteImagesForPage(page.id, [imageId])
      const updatedGallery = existingImages.filter((image) => image.id !== imageId).map((image) => image.id)
      await updatePage(page.id, { gallery: updatedGallery }) as unknown as Page

      if(updatedGallery.length > 0) {
        setExistingImages(existingImages.filter((image) => image.id !== imageId) as Image[])
      }

      toast({
        title: 'Image deleted',
        description: 'Image has been deleted.',
        status: 'success'
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Failed to delete image',
        description: 'Please try again.',
        status: 'error'
      });
    }
  }

  const generateUrlSlug = (name: string): string => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const initialValues: EditPageFormValues = {
    page_name: page.page_name,
    page_url: page.page_url,
    page_description: page.page_description,
    is_active: page.is_active,
    sort_order: page.sort_order,
    files: [],
    heroImageFile: null,
    keywords: page.keywords || ''
  }

  const handleSubmit = async (
    values: EditPageFormValues,
    { setSubmitting, setFieldError }: FormikHelpers<EditPageFormValues>
  ) => {
    console.log('Form submitted!', values)
    try {
      // 1. Upload hero image if a new one is provided
      let heroImageUrl = page.hero_image
      if (values.heroImageFile) {
        setIsUploading(true)
        try {
          const heroImageResponse = await uploadPageGalleryImages([values.heroImageFile])
          
          if (heroImageResponse.totalErrors > 0 || heroImageResponse.results.length === 0) {
            setFieldError('heroImageFile', 'Failed to upload hero image. Please try again.')
            return
          }
          
          const successfulUpload = heroImageResponse.results.find((r: any) => r.success && r.url)
          if (!successfulUpload) {
            setFieldError('heroImageFile', 'Failed to upload hero image. Please try again.')
            return
          }
          
          heroImageUrl = successfulUpload.url
          console.log('New hero image uploaded:', heroImageUrl)
        } catch (heroUploadError) {
          console.error('Hero image upload failed:', heroUploadError)
          setFieldError('heroImageFile', 'Failed to upload hero image. Please try again.')
          return
        } finally {
          setIsUploading(false)
        }
      }
      
      // 2. Update page basic info including hero image
      const pageData: Partial<CreatePageInput> = {
        page_name: values.page_name,
        page_url: values.page_url,
        page_description: values.page_description,
        is_active: values.is_active,
        sort_order: values.sort_order,
        hero_image: heroImageUrl,
        keywords: values.keywords
      }

      console.log('Updating page...', pageData)
      await updatePage(page.id, pageData)
      console.log('Page updated')

      // 3. Upload new gallery images and create image records (if any new files are selected)
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

          // Create image records in database
          const imageRecords = await createImagesForPage(uploadResponse, page.id)
          const newGalleryImageIds = imageRecords.map((img: any) => img.id)

          console.log('Created image records with IDs:', newGalleryImageIds)

          // Merge with existing gallery IDs
          const existingGallery = page.gallery || []
          const updatedGallery = [...existingGallery, ...newGalleryImageIds]

          // Update the page with combined gallery image IDs
          await updatePage(page.id, { gallery: updatedGallery })
          console.log('Updated page with gallery image IDs:', updatedGallery)

        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          setFieldError('files', 'Failed to upload images. Please try again.')
          return
        } finally {
          setIsUploading(false)
        }
      }

      router.refresh()

    } catch (error) {
      console.error('Error updating page:', error)
      setFieldError('page_name', 'Failed to update page. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={true}
      validateOnBlur={true}
    >
      {({ values, errors, touched, setFieldValue, isSubmitting, isValid }) => {
        console.log('Formik state:', { errors, touched, isSubmitting, isValid, isUploading })
        return (
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
              <Field.Label>Sort Order</Field.Label>
              <Field.Input
                type="number"
                name="sort_order"
                value={values.sort_order}
                onChange={(e) => {
                  setFieldValue('sort_order', parseInt(e.target.value) || 0)
                }}
                placeholder="Enter sort order (0, 1, 2, etc.)"
              />
              {errors.sort_order && touched.sort_order && (
                <Field.ErrorText>{errors.sort_order}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>Keywords</Field.Label>
              <Field.Input
                name="keywords"
                value={values.keywords}
                onChange={(e) => setFieldValue('keywords', e.target.value)}
                placeholder="Enter SEO keywords (comma-separated)"
              />
              <Field.HelperText>Enter keywords for SEO metadata (e.g., photography, street art, urban)</Field.HelperText>
              {errors.keywords && touched.keywords && (
                <Field.ErrorText>{errors.keywords}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <FormLabel>Hero Image</FormLabel>
              {page.hero_image && !heroImageFile && (
                <div className={css({ mb: 3, position: 'relative', width: 'fit-content' })}>
                  <p className={css({ fontSize: 'sm', color: 'gray.600', mb: 2 })}>Current hero image:</p>
                  <NextImage 
                    src={page.hero_image} 
                    alt="Current hero image"
                    width={300}
                    height={200}
                    unoptimized={true}
                    className={css({
                      borderRadius: 'md',
                      border: '1px solid',
                      borderColor: 'gray.200'
                    })}
                  />
                </div>
              )}
              <FileUpload.Root
                maxFiles={1}
                onFileChange={(details) => {
                  const file = details.acceptedFiles[0] || null
                  setHeroImageFile(file)
                  setFieldValue('heroImageFile', file)
                }}
              >
                <FileUpload.Dropzone>
                  <FileUpload.Label>
                    {page.hero_image ? 'Drop a new hero image here to replace the current one' : 'Drop your hero image here or click to browse'}
                  </FileUpload.Label>
                  <FileUpload.Trigger asChild>
                    <Button size="sm" type="button">
                      {page.hero_image ? 'Replace Hero Image' : 'Choose Hero Image'}
                    </Button>
                  </FileUpload.Trigger>
                </FileUpload.Dropzone>
                <FileUpload.ItemGroup>
                  <FileUpload.Context>
                    {({ acceptedFiles }) =>
                      acceptedFiles.map((file, id) => (
                        <FileUpload.Item key={id} file={file} className={css({
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
                            <FileUpload.ItemPreview type="image/*">
                              <FileUpload.ItemPreviewImage className={css({
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: 'sm'
                              })} />
                            </FileUpload.ItemPreview>
                            <div>
                              <FileUpload.ItemName className={css({ fontWeight: 'medium' })} />
                              <FileUpload.ItemSizeText className={css({ 
                                fontSize: 'sm', 
                                color: 'gray.600' 
                              })} />
                            </div>
                          </div>
                          <FileUpload.ItemDeleteTrigger asChild>
                            <IconButton variant="link" size="sm" type="button">
                              <Trash2Icon />
                            </IconButton>
                          </FileUpload.ItemDeleteTrigger>
                        </FileUpload.Item>
                      ))
                    }
                  </FileUpload.Context>
                </FileUpload.ItemGroup>
                <FileUpload.HiddenInput />
              </FileUpload.Root>
              {errors.heroImageFile && touched.heroImageFile && (
                <Field.ErrorText>{String(errors.heroImageFile)}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <FormLabel>Add More Gallery Images (Optional)</FormLabel>
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
                <FileUpload.ItemGroup>
                  <FileUpload.Context>
                    {() => (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={files.map((file) => ({ id: file.name }))}
                          strategy={verticalListSortingStrategy}
                        >
                          {files.map((file) => (
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
                                    <FileUpload.ItemPreview type="image/*">
                                      <FileUpload.ItemPreviewImage className={css({
                                        width: '50px',
                                        height: '50px',
                                        objectFit: 'cover',
                                        borderRadius: 'sm'
                                      })} />
                                    </FileUpload.ItemPreview>
                                    <div>
                                      <FileUpload.ItemName className={css({ fontWeight: 'medium' })} />
                                      <FileUpload.ItemSizeText className={css({
                                        fontSize: 'sm',
                                        color: 'gray.600'
                                      })} />
                                    </div>
                                  </div>
                                </div>
                                <FileUpload.ItemDeleteTrigger asChild>
                                  <IconButton variant="link" size="sm" type="button">
                                    <Trash2Icon />
                                  </IconButton>
                                </FileUpload.ItemDeleteTrigger>
                              </FileUpload.Item>
                            </SortableItem>
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </FileUpload.Context>
                </FileUpload.ItemGroup>
                <FileUpload.HiddenInput />
              </FileUpload.Root>
              {errors.files && touched.files && (
                <Field.ErrorText>{String(errors.files)}</Field.ErrorText>
              )}
            </Field.Root>

            {existingImages.length > 0 && (
              <div className={css({ display: 'flex', flexDirection: 'column', gap: 3 })}>
                <p className={css({ fontWeight: 'bold', mb: 1 })}>Images:</p>
                <p>{images.length} items</p>
                <Masonry
                  breakpointCols={{
                    default: 3,
                    1100: 2,
                    700: 1
                  }}
                  className={css({
                    display: 'flex',
                    marginLeft: '-16px',
                    width: 'auto',
                    mb: 3
                  })}
                  columnClassName={css({
                    paddingLeft: '16px',
                    backgroundClip: 'padding-box'
                  })}
                >
                  {existingImages.map((image: Image) => (
                    <div
                      key={image.id}
                      className={css({
                        mb: 4,
                        position: 'relative',
                        width: '100%',
                        borderRadius: 'md'
                      })}
                    >
                      <IconButton size="sm" type="button" onClick={() => handleDeleteImage(image.id)} className={css({
                        position: 'absolute',
                        backgroundColor: 'white',
                        borderRadius: 'full',
                        border: "1px solid",
                        borderColor: "#000",
                        padding: 2,
                        top: "-0.5rem",
                        right: "-0.5rem",
                        zIndex: 10,
                        cursor: 'pointer'
                      })}>
                        <Trash2Icon stroke="#000" />
                      </IconButton>
                      <NextImage 
                        src={image.image_url} 
                        alt={image.image_description || 'Gallery image'}
                        width={0}
                        height={0}
                        sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                        unoptimized={true}
                        className={css({
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        })}
                        quality={85}
                        priority={false}
                      />
                    </div>
                  ))}
                </Masonry>
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className={css({
                p: 3,
                bg: 'red.50',
                border: '1px solid',
                borderColor: 'red.300',
                borderRadius: 'md',
                mb: 2
              })}>
                <p className={css({ fontWeight: 'bold', color: 'red.700', mb: 1 })}>
                  Please fix the following errors:
                </p>
                <ul className={css({ listStyle: 'disc', pl: 5, color: 'red.600' })}>
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{String(error)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={css({ display: 'flex', gap: 2, mt: 4 })}>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
              >
                {isUploading
                  ? 'Uploading Images...'
                  : isSubmitting
                    ? 'Updating Page...'
                    : 'Update Page'
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Form>
        )
      }}
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

export default EditPageForm
