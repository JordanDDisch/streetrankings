// Interface matching the database Pages table structure
export interface Page {
  id: string;
  page_name: string;
  page_url: string;
  page_description: string;
  is_active: boolean;
  gallery: string[]; // Array of image UUIDs
  hero_image?: string; // URL to the hero image
  created_at: Date;
  updated_at: Date;
}

// Interface for creating a new page (without auto-generated fields)
export interface CreatePageInput {
  page_name: string;
  page_url: string;
  page_description: string;
  is_active?: boolean;
  gallery?: string[];
  hero_image?: string;
}

// Interface for form values (before submission)
export interface CreatePageFormValues {
  page_name: string;
  page_url: string;
  page_description: string;
  is_active: boolean;
  files: File[];
  heroImageFile: File | null;
} 