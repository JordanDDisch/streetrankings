// Define your API response types here
export interface ProcessImagesResponse {
  images: string[];
  zipFile: string|null;
  errors: string[];
}
