/**
 * Type-safe interfaces for the preview images component
 */

export interface ImageItem extends Record<string, string | number | undefined> {
  project_image_id?: number;
}

export type ImageSource = ImageItem | string;

export interface PreviewImagesDialogData {
  title: string;
  name: string;
  images: ImageSource | ImageSource[];
  storageUrl?: string;
  initialIndex?: number;
}

export interface ScrollState {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export interface NavigationState {
  currentIndex: number;
  totalImages: number;
  selectedImageUrl: string;
}

/**
 * Type guard to check if ImageSource is an ImageItem object
 */
export function isImageItem(image: ImageSource): image is ImageItem {
  return typeof image === 'object' && image !== null;
}

