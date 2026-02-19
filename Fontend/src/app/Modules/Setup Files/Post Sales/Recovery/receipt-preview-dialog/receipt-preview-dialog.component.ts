import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-receipt-preview-dialog',
  standalone: true,
  imports: [
     CommonModule,
     RouterModule,
     TemplateComponent,
     BreadcrumbComponent,
     AngularMaterialModule,
     FormsModule,
     ReactiveFormsModule,
     TruncatePipe,
   ],
  templateUrl: './receipt-preview-dialog.component.html',
  styleUrl: './receipt-preview-dialog.component.scss'
})
export class ReceiptPreviewDialogComponent implements OnInit {
  isLoading = true;
  fileUrl: SafeResourceUrl = '' as unknown as SafeResourceUrl;
  isPdf = false;
  isImage = false;
  hasError = false;
  errorMessage = '';
  fileName = '';
  imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
  showDownloadButton = false;
  isDownloading = false;
  
  constructor(
     private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<ReceiptPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fileUrl: string, title: string }
  ) {
    try {
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.fileUrl);
      this.fileName = this.extractFileName(data.fileUrl);
    } catch (error) {
      this.handleError('Failed to process file URL');
    }
  }
  
  ngOnInit(): void {
    console.log(this.data);
    
    this.checkFileType();
  }

  extractFileName(url: string): string {
    return url.split('/').pop() || 'receipt';
  }

  checkFileType(): void {
    try {
      const url = this.data.fileUrl.toLowerCase();
      
      // Check if it's PDF
      if (url.endsWith('.pdf')) {
        this.isPdf = true;
        this.showDownloadButton = true; // Show download button for PDFs
        this.isLoading = false;
        return;
      }
      
      // Check if it's an image
      const isImage = this.imageExtensions.some(ext => url.endsWith(`.${ext}`));
      if (isImage) {
        this.isImage = true;
        this.showDownloadButton = true; // Show download button for images
        this.isLoading = false;
        return;
      }
      
      // If neither PDF nor image
      this.isLoading = false;
    } catch (error) {
      this.handleError('Failed to determine file type');
    }
  }

  handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
    console.error(message);
  }

  async downloadFile(): Promise<void> {
    if (this.isDownloading) return;
    
    this.isDownloading = true;
    
    try {
      // Fetch the file as a blob
      const response = await fetch(this.data.fileUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Determine the correct MIME type based on file extension
      const mimeType = this.getMimeType(this.fileName);
      const blobWithType = new Blob([blob], { type: mimeType });
      
      // Create object URL from blob
      const blobUrl = window.URL.createObjectURL(blobWithType);
      
      // Create and trigger download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = this.fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      console.log('File downloaded successfully:', this.fileName);
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback method for cross-origin or other issues
      try {
        const link = document.createElement('a');
        link.href = this.data.fileUrl;
        link.download = this.fileName;
        link.target = '_blank';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        this.handleError('Failed to download file. Please try opening in a new tab.');
      }
    } finally {
      this.isDownloading = false;
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }


}
