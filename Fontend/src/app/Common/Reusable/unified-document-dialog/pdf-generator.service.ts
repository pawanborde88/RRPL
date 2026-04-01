import { Injectable, NgZone, signal, inject } from '@angular/core';
import { RenderingEngine, RenderingOptions } from './rendering-pipeline/rendering-engine';

export interface PdfProgress {
  current: number;
  total: number;
}

export interface PdfGeneratorOptions {
  fileName?: string;
  forViewer?: boolean;
  scale?: number;
  imageQuality?: number;
  imageTimeout?: number;
}

/**
 * Enterprise-grade PDF Generator Service
 * 
 * Uses a modular rendering pipeline to generate large PDFs (50-200+ pages)
 * entirely on the client-side without blocking the UI.
 */
@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  private readonly ngZone = inject(NgZone);
  private readonly renderingEngine = new RenderingEngine();

  /** Signal for tracking reproduction progress */
  readonly pdfProgress = signal<PdfProgress | null>(null);

  /** Signal for tracking generation state */
  readonly isGeneratingPDF = signal(false);

  /** Controller for cancelling long-running generation tasks */
  private abortController: AbortController | null = null;

  /**
   * Cancels any ongoing PDF generation process.
   */
  cancelGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Generates a PDF from HTML chunks.
   * 
   * @param chunks Array of HTML strings, each representing a logical section or page.
   * @param options Configuration for PDF generation.
   * @returns A Promise that resolves to a Blob (if forViewer is true) or null (if downloaded).
   */
  async generatePdf(chunks: string[], options: PdfGeneratorOptions = {}): Promise<Blob | null> {
    if (this.isGeneratingPDF() || chunks.length === 0) return null;

    const config = {
      fileName: options.fileName || `document_${Date.now()}.pdf`,
      forViewer: options.forViewer || false,
      scale: options.scale || 2,
      imageQuality: options.imageQuality || 0.9, // Optimized for file size
      imageTimeout: options.imageTimeout || 15000
    };

    this.isGeneratingPDF.set(true);
    this.pdfProgress.set({ current: 0, total: chunks.length });
    this.abortController = new AbortController();

    try {
      // Run outside Angular to avoid unnecessary change detection cycles
      return await this.ngZone.runOutsideAngular(async () => {
        const renderingOptions: RenderingOptions = {
          scale: config.scale,
          imageQuality: config.imageQuality,
          imageTimeout: config.imageTimeout,
          abortSignal: this.abortController?.signal,
          onProgress: (current, total) => {
            this.ngZone.run(() => this.pdfProgress.set({ current, total }));
          }
        };

        const pdf = await this.renderingEngine.render(chunks, renderingOptions);

        if (config.forViewer) {
          return pdf.output('blob');
        } else {
          pdf.save(config.fileName);
          return null;
        }
      });
    } catch (error: any) {
      if (error.message?.includes('cancelled')) {
        console.warn('PDF Generation was aborted by user.');
        return null;
      }
      console.error('Enterprise PdfGenerator Error:', error);
      throw error;
    } finally {
      this.ngZone.run(() => {
        this.isGeneratingPDF.set(false);
        this.pdfProgress.set(null);
        this.abortController = null;
      });
    }
  }
}
