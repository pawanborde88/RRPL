import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
  effect,
  DestroyRef,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SafeHtml } from '@angular/platform-browser';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { CostomLoadingComponent } from '../coustom Loader/costom-loading/costom-loading.component';
import { TemplateComponent } from '../../template/template.component';
import { DocumentDialogData } from './unified-document-dialog.interfaces';
import { UnifiedDocumentDialogStore } from './unified-document-dialog.store';

// Import jsPDF and html2canvas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PRINT_IFRAME_CLEANUP_DELAY_MS = 100;

@Component({
  selector: 'app-unified-document-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CostomLoadingComponent
  ],
  providers: [UnifiedDocumentDialogStore],
  templateUrl: './unified-document-dialog.component.html',
  styleUrl: './unified-document-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnifiedDocumentDialogComponent implements OnInit {
  public readonly store = inject(UnifiedDocumentDialogStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  public readonly dialogRef = inject(MatDialogRef<UnifiedDocumentDialogComponent>);
  public readonly data = inject<DocumentDialogData>(MAT_DIALOG_DATA);

  @ViewChild('receiptContainer', { static: false })
  private receiptContainerRef?: ElementRef<HTMLElement>;

  private imageAdjustmentFrameId: number | null = null;

  private readonly LOGO_CONFIG = { maxWidth: 150, maxHeight: 80 };
  private readonly PRINT_CONFIG = { cleanupDelay: 1000, printDelay: 100 };

  // Track PDF generation state
  isGeneratingPDF = false;

  constructor() {
    effect(() => {
      if (this.store.processedHtml()) {
        if (this.imageAdjustmentFrameId !== null) cancelAnimationFrame(this.imageAdjustmentFrameId);
        this.imageAdjustmentFrameId = requestAnimationFrame(() => this.optimizeLogos());
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.imageAdjustmentFrameId !== null) cancelAnimationFrame(this.imageAdjustmentFrameId);
      this.store.clearOutput();
    });
  }

  ngOnInit(): void {
    this.store.initialize(this.data);
  }

  private optimizeLogos(): void {
    this.imageAdjustmentFrameId = null;
    const container = this.receiptContainerRef?.nativeElement ||
      document.querySelector<HTMLElement>('.receipt-container, .main-page');
    if (!container) return;

    container.querySelectorAll<HTMLImageElement>('img').forEach(img => {
      if (this.isLogo(img)) this.handleLogo(img);
      else this.styleRegularImage(img);
    });
  }

  private isLogo(img: HTMLImageElement): boolean {
    const src = (img.getAttribute('src') || '').toLowerCase();
    const isLogoBySrc = src.includes('company_logo') || src.includes('project_logo');
    const isHeaderLogo = this.isHeaderTableLogo(img);
    return isLogoBySrc || isHeaderLogo;
  }

  private isHeaderTableLogo(img: HTMLImageElement): boolean {
    const parentTable = img.closest('table');
    if (!parentTable) return false;
    const cells = parentTable.querySelectorAll('tr:first-child td');
    const cellIndex = Array.from(cells).findIndex(cell => cell.contains(img));
    return cellIndex === 0 || cellIndex === 2;
  }

  private handleLogo(img: HTMLImageElement): void {
    img.classList.remove('companylogo', 'projectlogo');
    img.classList.add('document-logo');

    if (img.complete) this.adjustLogo(img);
    else {
      img.onload = () => this.adjustLogo(img);
      img.onerror = () => this.applyFallbackLogoStyle(img);
    }

    this.applyLogoStyle(img);
  }

  private adjustLogo(img: HTMLImageElement): void {
    const { naturalWidth: w, naturalHeight: h } = img;
    if (w === 0 || h === 0) return this.applyFallbackLogoStyle(img);

    const ratio = w / h;
    let width, height;

    if (ratio > (this.LOGO_CONFIG.maxWidth / this.LOGO_CONFIG.maxHeight)) {
      width = this.LOGO_CONFIG.maxWidth;
      height = this.LOGO_CONFIG.maxWidth / ratio;
    } else {
      height = this.LOGO_CONFIG.maxHeight;
      width = this.LOGO_CONFIG.maxHeight * ratio;
    }

    width = Math.min(width, this.LOGO_CONFIG.maxWidth);
    height = Math.min(height, this.LOGO_CONFIG.maxHeight);

    img.style.width = `${width}px`;
    img.style.height = `${height}px`;

    if (width < this.LOGO_CONFIG.maxWidth || height < this.LOGO_CONFIG.maxHeight) {
      img.style.margin = '0 auto';
      img.style.display = 'block';
    }
  }

  private applyLogoStyle(img: HTMLImageElement): void {
    Object.assign(img.style, {
      maxWidth: `${this.LOGO_CONFIG.maxWidth}px`,
      maxHeight: `${this.LOGO_CONFIG.maxHeight}px`,
      objectFit: 'contain',
      objectPosition: 'center',
      display: 'inline-block',
      verticalAlign: 'middle',
      width: 'auto',
      height: 'auto'
    });
  }

  private applyFallbackLogoStyle(img: HTMLImageElement): void {
    this.applyLogoStyle(img);
  }

  private styleRegularImage(img: HTMLImageElement): void {
    img.loading = 'lazy';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
  }

  print(): void {
    const content = this.store.processedHtml();
    if (!content) return;

    const receiptElement = this.receiptContainerRef?.nativeElement ||
      document.querySelector<HTMLElement>('.receipt-container, .main-page');
    if (!receiptElement) return;

    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'fixed', width: '0', height: '0', border: '0', visibility: 'hidden'
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return this.removeIframe(iframe);

    const cleanedHtml = receiptElement.innerHTML
      .replace(/class="(companylogo|projectlogo)"/g, 'class="$1 document-logo"')
      .replace(/style="[^"]*width:\s*(180|170)px[^"]*"/gi, '')
      .replace(/style="[^"]*height:\s*(100|26)px[^"]*"/gi, '');

    const styles = this.getPrintStyles();
    const title = this.store.dialogTitle();

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>${title}</title><style>${styles}</style></head>
              <body><div class="receipt-container">${cleanedHtml}</div></body></html>`);
    doc.close();

    this.adjustPrintLogos(doc);
    this.printAfterImagesLoaded(iframe, doc);
  }

  async downloadPDF(): Promise<void> {
    if (!this.receiptContainerRef?.nativeElement || this.isGeneratingPDF) {
      return;
    }

    this.isGeneratingPDF = true;
    this.cdr.markForCheck();

    // Yield so "Generating..." is painted before blocking work
    await new Promise<void>((r) => setTimeout(r, 0));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const element = this.receiptContainerRef.nativeElement;
    const title = this.store.dialogTitle();

    this.ngZone.runOutsideAngular(async () => {
      await new Promise<void>((r) => setTimeout(r, 0));
      const s = (globalThis as any).scheduler;
      if (typeof s?.yield === 'function') await s.yield();
      try {
        const options = {
          scale: 1.25,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 8000,
          onclone: (_doc: Document, clonedEl: HTMLElement) => this.applyPdfCloneStyles(clonedEl)
        };

        const canvas = await html2canvas(element, options as any);

        const imgData = await new Promise<string>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('toBlob failed'));
                return;
              }
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result as string);
              fr.onerror = () => reject(fr.error);
              fr.readAsDataURL(blob);
            },
            'image/jpeg',
            0.95
          );
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        let position = 0;
        let heightLeft = imgHeight;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          await new Promise<void>((r) => setTimeout(r, 0));
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }

        const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
        pdf.save(fileName);

        this.ngZone.run(() => {
          this.isGeneratingPDF = false;
          this.cdr.markForCheck();
          this.snackBar.open('PDF downloaded successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        this.ngZone.run(() => {
          this.isGeneratingPDF = false;
          this.cdr.markForCheck();
          this.snackBar.open('Error generating PDF. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        });
      }
    });
  }

  private applyPdfCloneStyles(el: HTMLElement): void {
    Object.assign(el.style, {
      width: '210mm',
      padding: '20mm',
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    });
  }

  private adjustPrintLogos(doc: Document): void {
    doc.querySelectorAll<HTMLImageElement>('img.document-logo').forEach(img => {
      if (img.complete) this.adjustPrintLogo(img);
      else img.onload = () => this.adjustPrintLogo(img);
    });
  }

  private adjustPrintLogo(img: HTMLImageElement): void {
    const { naturalWidth: w, naturalHeight: h } = img;
    if (w === 0 || h === 0) return;

    const ratio = w / h;
    let width, height;

    if (ratio > (this.LOGO_CONFIG.maxWidth / this.LOGO_CONFIG.maxHeight)) {
      width = this.LOGO_CONFIG.maxWidth;
      height = this.LOGO_CONFIG.maxWidth / ratio;
    } else {
      height = this.LOGO_CONFIG.maxHeight;
      width = this.LOGO_CONFIG.maxHeight * ratio;
    }

    width = Math.min(width, this.LOGO_CONFIG.maxWidth);
    height = Math.min(height, this.LOGO_CONFIG.maxHeight);

    Object.assign(img.style, {
      maxWidth: `${this.LOGO_CONFIG.maxWidth}px !important`,
      maxHeight: `${this.LOGO_CONFIG.maxHeight}px !important`,
      width: `${width}px !important`,
      height: `${height}px !important`,
      objectFit: 'contain !important',
      objectPosition: 'center !important',
      display: 'inline-block !important',
      verticalAlign: 'middle !important',
      margin: '0 auto !important'
    });

    const parentTd = img.closest('td');
    if (parentTd) Object.assign(parentTd.style, { textAlign: 'center', verticalAlign: 'middle' });
  }

  private printAfterImagesLoaded(iframe: HTMLIFrameElement, doc: Document): void {
    const win = iframe.contentWindow;
    if (!win) return this.removeIframe(iframe);

    const images = doc.querySelectorAll<HTMLImageElement>('img');
    if (images.length === 0) return this.executePrint(win, iframe);

    let loadedCount = 0;
    const checkAndPrint = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        this.adjustPrintLogos(doc);
        setTimeout(() => this.executePrint(win, iframe), this.PRINT_CONFIG.printDelay);
      }
    };

    images.forEach(img => {
      if (img.complete) checkAndPrint();
      else {
        img.onload = checkAndPrint;
        img.onerror = checkAndPrint;
      }
    });
  }

  private executePrint(win: Window, iframe: HTMLIFrameElement): void {
    win.focus();
    win.print();
    setTimeout(() => this.removeIframe(iframe), this.PRINT_CONFIG.cleanupDelay);
  }

  private removeIframe(iframe: HTMLIFrameElement): void {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }

  /** @param forPdf when true, body gets 0.5in padding to match print @page margin in PDF output */
  private getPrintStyles(forPdf?: boolean): string {
    const bodyPadding = forPdf ? '0.5in' : '0';
    return `
      body { margin: 0; padding: ${bodyPadding}; box-sizing: border-box; }
      .receipt-container { max-width: 210mm; margin: 0 auto; background: white !important; box-sizing: border-box; }
      .document-logo { max-width: ${this.LOGO_CONFIG.maxWidth}px !important; max-height: ${this.LOGO_CONFIG.maxHeight}px !important;
                       width: auto !important; height: auto !important; object-fit: contain !important; }
      td:has(> img.document-logo) {
        width: ${this.LOGO_CONFIG.maxWidth}px !important; min-width: ${this.LOGO_CONFIG.maxWidth}px !important;
        text-align: center !important; vertical-align: middle !important;
      }
      img:not(.document-logo) { max-width: 100% !important; height: auto !important; }
      @media print {
        @page { size: A4; margin: 0.5in; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;
  }

  private waitForImages(doc: Document): Promise<void> {
    const images = doc.querySelectorAll<HTMLImageElement>('img');
    if (images.length === 0) return Promise.resolve();
    return new Promise((resolve) => {
      let loaded = 0;
      const check = () => {
        loaded++;
        if (loaded === images.length) resolve();
      };
      images.forEach((img) => {
        if (img.complete) check();
        else {
          img.onload = check;
          img.onerror = check;
        }
      });
    });
  }
}