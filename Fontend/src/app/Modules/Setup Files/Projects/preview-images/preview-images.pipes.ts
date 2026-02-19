/**
 * Pure pipes for performance optimization
 * These pipes cache results and only recompute when inputs change
 */

import { Pipe, PipeTransform } from '@angular/core';
import { ImageItem, ImageSource } from './preview-images.models';

/**
 * Resolves the actual image path from either an object or string
 */
@Pipe({
  name: 'resolveImage',
  standalone: true,
  pure: true // Ensures caching and memoization
})
export class ResolveImagePipe implements PipeTransform {
  transform(image: ImageSource, imageKey: string): string {
    if (!image) return '';
    return typeof image === 'object' && imageKey in image
      ? (image[imageKey] as string)
      : (image as string);
  }
}

/**
 * Checks if an image is the currently selected one
 */
@Pipe({
  name: 'isImageSelected',
  standalone: true,
  pure: true
})
export class IsImageSelectedPipe implements PipeTransform {
  transform(image: ImageSource, selectedImage: string, imageKey: string): boolean {
    if (!image || !selectedImage) return false;
    const imageUrl = typeof image === 'object' && imageKey in image
      ? (image[imageKey] as string)
      : (image as string);
    return imageUrl === selectedImage;
  }
}

/**
 * Gets the full storage URL for an image
 */
@Pipe({
  name: 'imageUrl',
  standalone: true,
  pure: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(imagePath: string, storageUrl: string): string {
    if (!imagePath || !storageUrl) return '';
    return `${storageUrl}/${imagePath}`;
  }
}





















































