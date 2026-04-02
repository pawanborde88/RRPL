/**
 * PdfResourceManager Utility
 * 
 * Responsible for handling external resources (images, fonts) before rendering.
 */
export class PdfResourceManager {
  /**
   * Ensures all images within a container are fully loaded.
   */
  public static async preloadImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'));
    const promises = images.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`PdfResourceManager: Failed to load image: ${img.src}`);
          resolve(); // Resolve anyway to not block the whole process
        };
      });
    });

    await Promise.all(promises);
  }

  /**
   * Ensures all fonts are ready for rendering.
   */
  public static async waitForFonts(): Promise<void> {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  }

  /**
   * Compresses an image element into a base64 JPEG to save PDF size.
   * Useful for high-res images that don't need full quality in PDF chunks.
   */
  public static async compressImage(img: HTMLImageElement, quality: number = 0.8): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(img.src);
      }
    });
  }
}
