import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PdfPreprocessor } from './preprocessor.utility';
import { PdfResourceManager } from './resource-manager.utility';

export interface RenderingOptions {
  scale: number;
  imageQuality: number;
  imageTimeout: number;
  onProgress?: (current: number, total: number) => void;
  abortSignal?: AbortSignal;
}

/**
 * RenderingEngine
 * 
 * Orchestrates the chunked rendering pipeline.
 * Converts HTML chunks to a jsPDF instance in a non-blocking manner.
 */
export class RenderingEngine {
  private static readonly PAGE_WIDTH_MM = 210;
  private static readonly PAGE_HEIGHT_MM = 297;

  /**
   * Processes a list of HTML chunks and returns a jsPDF document.
   */
  public async render(chunks: string[], options: RenderingOptions): Promise<jsPDF> {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const container = this.createHiddenContainer();

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (options.abortSignal?.aborted) {
          throw new Error('PDF generation cancelled by user.');
        }

        // 1. Prepare DOM
        const chunkEl = this.prepareElement(chunks[i]);
        container.innerHTML = '';
        container.appendChild(chunkEl);

        // 2. Preprocess & Resource Check
        PdfPreprocessor.normalize(chunkEl);
        await PdfResourceManager.waitForFonts();
        await PdfResourceManager.preloadImages(chunkEl);

        // 3. Yield to keep UI responsive
        await this.yield();

        // 4. Render to Canvas
        const canvas = await html2canvas(chunkEl, {
          scale: options.scale,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: options.imageTimeout,
          onclone: (_doc: Document, clonedEl: HTMLElement) => {
            // Final layout enforcement in clone
            clonedEl.style.width = `${RenderingEngine.PAGE_WIDTH_MM}mm`;
          }
        } as any);

        // 5. Add to PDF
        const imgData = canvas.toDataURL('image/jpeg', options.imageQuality);
        const imgHeightMm = (canvas.height * RenderingEngine.PAGE_WIDTH_MM) / canvas.width;

        if (i > 0) pdf.addPage();

        // Handle chunks that might span multiple A4 pages
        let heightRemaining = imgHeightMm;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, RenderingEngine.PAGE_WIDTH_MM, imgHeightMm, undefined, 'FAST');
        heightRemaining -= RenderingEngine.PAGE_HEIGHT_MM;

        while (heightRemaining > 0) {
          if (options.abortSignal?.aborted) throw new Error('PDF generation cancelled.');
          await this.yield();

          pdf.addPage();
          position = heightRemaining - imgHeightMm;
          pdf.addImage(imgData, 'JPEG', 0, position, RenderingEngine.PAGE_WIDTH_MM, imgHeightMm, undefined, 'FAST');
          heightRemaining -= RenderingEngine.PAGE_HEIGHT_MM;
        }

        // 6. Report Progress
        if (options.onProgress) {
          options.onProgress(i + 1, chunks.length);
        }

        // Cleanup canvas memory
        canvas.width = 0;
        canvas.height = 0;
      }

      return pdf;
    } finally {
      this.cleanup(container);
    }
  }

  private createHiddenContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'rendering-engine-host';
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${RenderingEngine.PAGE_WIDTH_MM}mm;
      z-index: -1000;
      visibility: hidden;
      contain: content;
    `;
    document.body.appendChild(container);
    return container;
  }

  private prepareElement(html: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'rendering-chunk';
    el.innerHTML = html;
    return el;
  }

  private async yield(): Promise<void> {
    const s = (globalThis as any).scheduler;
    if (typeof s?.yield === 'function') {
      await s.yield();
    } else if (typeof requestIdleCallback === 'function') {
      return new Promise(resolve => requestIdleCallback(() => resolve()));
    } else {
      return new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  private cleanup(container: HTMLElement): void {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Explicitly help garbage collection for large content
    container.innerHTML = '';
  }
}
