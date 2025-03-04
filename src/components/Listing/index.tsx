"use client";
import { useState } from "react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { css } from "styled-system/css";
import { Portal } from '@ark-ui/react/portal'
import { Template } from "@/types/templates";
import { FileUpload } from '@/components/ui/file-upload'
import { IconButton } from '@/components/ui/styled/icon-button'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Trash2Icon, ChevronDownIcon } from 'lucide-react'
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";

const Listing = (): JSX.Element => {
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [template, setTemplate] = useState<string>(Template.STORY);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const templateOptions = [{
    label: "Story",
    value: Template.STORY
  }, {
    label: "Post",
    value: Template.POST
  }]

  const handleDownloadZip = async () => {
    if (images.length > 1) {
      const zip = new JSZip();
      
      for (let i = 0; i < images.length; i++) {
        const response = await fetch(images[i]);
        const blob = await response.blob();
        zip.file(`image_${i + 1}.png`, blob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'processed_images.zip');
    } else if (images.length === 1) {
      saveAs(images[0], 'processed_image.png');
    }
  };

  // Handle form submission to process the image
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      formData.set("template", template);

      const response = await fetch("/api/process-images", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const imageURLs: string[] = await response.json();
        setIsLoading(false);
        setImages(imageURLs);
        console.log("Images processed successfully");
      } else {
        console.error("Failed to process images");
      }
    } catch (error: any) {
      console.error("Error processing images:", error);
    }
  };

  return (
    <div>
      {images && images.length === 0 && <form onSubmit={handleSubmit} className={ css({ display: "flex", flexDirection: "column", gap: 4 }) }>
        <Select.Root 
          name="template" 
          id="template" 
          items={templateOptions}
          onValueChange={(details) => setTemplate(details.value[0])}
          positioning={{ sameWidth: true }} 
          width="2xs"
        >
          <Select.Label>Image Dimensions</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select a image dimension" />
                <Select.Indicator>
                  <ChevronDownIcon />
                </Select.Indicator>
              </Select.Trigger>
              <Select.ClearTrigger>Clear</Select.ClearTrigger>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  <Select.ItemGroup>
                    <Select.ItemGroupLabel>Image Dimensions</Select.ItemGroupLabel>
                    {templateOptions.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator>✓</Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.ItemGroup>
                </Select.Content>
              </Select.Positioner>
            </Portal>
            <Select.HiddenSelect />
        </Select.Root>
        <FileUpload.Root
          onFileChange={(details) => setFiles(details.acceptedFiles)}
          maxFiles={30}
        >
          <FileUpload.Dropzone>
            <FileUpload.Label>Drop your files here</FileUpload.Label>
            <FileUpload.Trigger asChild>
              <Button size="sm">Open Dialog</Button>
            </FileUpload.Trigger>
          </FileUpload.Dropzone>
          <FileUpload.ItemGroup>
            <FileUpload.Context>
              {({ acceptedFiles }) =>
                acceptedFiles.map((file, id) => (
                  <FileUpload.Item key={id} file={file}>
                    <FileUpload.ItemPreview type="image/*">
                      <FileUpload.ItemPreviewImage />
                    </FileUpload.ItemPreview>
                    <FileUpload.ItemName />
                    <FileUpload.ItemSizeText />
                    <FileUpload.ItemDeleteTrigger asChild>
                      <IconButton variant="link" size="sm">
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
        <Button 
          width="fit-content"
           type="submit" 
           disabled={isLoading} 
        >
          {isLoading ? <Spinner /> : "Upload and Process Images"}
        </Button>
      </form>}
      {images && images.length > 0 && <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginTop: 4
        })}
      >
        <Heading as="h2" size="2xl">Processed Images</Heading>
        <Button width="fit-content" onClick={() => setImages([])}>New Resize</Button>
        <Button width="fit-content" onClick={handleDownloadZip}>
          Download {images.length > 1 ? 'ZIP' : 'Image'}
        </Button>
        <div className={css({
            display: "flex",
            flexDirection: "row",
            gap: 4,
            flexWrap: "wrap",
          })}
        >
          {images.map((imgSrc, index) => (
            <img className={css({
                width: "200px",
                height: "auto"
              })}
              key={index} 
              src={`${imgSrc}`}
            />
          ))}
          <button onClick={() => fetch(`/api/upload-to-instagram`, {
            method: "POST",
            body: JSON.stringify({image: images[0]})
          })}>Upload to Instagram</button>
        </div>
      </div>}
    </div>
  );
};

export default Listing;
