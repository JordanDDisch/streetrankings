// Define your API response types here
export interface ProcessImagesResponse {
  images: string[];
  zipFile: string|null;
  errors: string[];
}

export interface ProcessImagesRequest {
  files: File[];
  template: Template;
}