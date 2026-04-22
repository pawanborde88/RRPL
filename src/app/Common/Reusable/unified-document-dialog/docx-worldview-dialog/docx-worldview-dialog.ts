import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  DestroyRef
} from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UnifiedDocumentDialogService } from '../unified-document-dialog.service';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { normalizePublicDocumentUrl } from './normalize-public-document-url';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-docx-worldview-dialog',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  templateUrl: './docx-worldview-dialog.html',
  styleUrl: './docx-worldview-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocxWorldviewDialog implements OnInit {
  private static readonly preconnectedDocumentOrigins = new Set<string>();

  private readonly documentService = inject(UnifiedDocumentDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentRef = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  public readonly data = inject<any>(MAT_DIALOG_DATA);

  readonly letterData = signal<any>(null);
  readonly loading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  /**
   * Canonical public HTTPS URL for Office Online (trim, fix accidental full-string encoding, S3 → https).
   * Object must allow anonymous GET; S3: public ACL/bucket policy + Content-Type for .docx helps Office.
   */
  readonly previewUrl = computed(() => {
    const raw = this.letterData()?.file_url;
    if (typeof raw !== 'string') {
      return '';
    }
    return normalizePublicDocumentUrl(raw);
  });

  /** Embedded Google Docs viewer (more reliable for AWS S3 URLs without strict CORS or Office 365 limitations). */
  readonly officePublicViewUrl = computed(() => {
    const u = this.previewUrl();
    return u ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(u)}` : '';
  });

  /** Sanitized URL for use in the iframe src. */
  readonly safeOfficeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.officePublicViewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });



  constructor() {
    effect(() => {
      const href = this.previewUrl();
      if (!href) {
        return;
      }
      let origin: string;
      try {
        origin = new URL(href).origin;
      } catch {
        return;
      }
      if (DocxWorldviewDialog.preconnectedDocumentOrigins.has(origin)) {
        return;
      }
      DocxWorldviewDialog.preconnectedDocumentOrigins.add(origin);
      const head = this.documentRef.head;
      const link = this.documentRef.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    });
  }

  ngOnInit(): void {
    console.log(this.data);
    this.fetchLetterData();
  }

  fetchLetterData(): void {
    const { project_id, letter_type_id, letter_generation_id, file_url } = this.data;

    // Proactively use file_url if already provided in data to speed up display
    if (file_url) {
      this.letterData.set({ file_url });
      return;
    }

    if (project_id && letter_type_id && letter_generation_id) {
      this.loading.set(true);
      this.hasError.set(false);

      this.documentService.fetchAgreementLetter(project_id, letter_type_id, letter_generation_id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res && res.file_url) {
              this.letterData.set(res);
            } else {
              this.hasError.set(true);
            }
            this.loading.set(false);
          },
          error: (err) => {
            console.error('API Error:', err);
            this.hasError.set(true);
            this.loading.set(false);
          }
        });
    } else {
      console.warn('Missing required data for API call:', { project_id, letter_type_id, letter_generation_id });
      this.hasError.set(true);
    }
  }

}

