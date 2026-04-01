import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  DestroyRef,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { toPng, toBlob } from 'html-to-image';


// Components
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

// Local Imports
import { DsrReportStore } from './dsr-report.store';
import { generateSimpleReportHtml } from './dsr-report.utils';

@Component({
  selector: 'app-all-daily-dsrreport',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    CostomLoadingComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    MatExpansionModule,
  ],
  templateUrl: './all-daily-dsrreport.component.html',
  styleUrl: './all-daily-dsrreport.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllDailyDSRReportComponent implements AfterViewInit {

  @ViewChild('reportContainer') reportContainerRef?: ElementRef;


  // Inject store and other dependencies
  readonly store = inject(DsrReportStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Local state
  readonly isDownloading = signal(false);
  private readonly projectIdSignal = signal<number | null>(null);

  // Form setup
  readonly addUnitBankerForm = new FormGroup({
    project_id: new FormControl<number | null>(null, [Validators.required]),
    telecaller_id: new FormControl<number[]>([]),
    sales_executive_id: new FormControl<number[]>([]),
  });

  // Computed properties
  readonly hasProjectSelected = computed(() => !!this.projectIdSignal());
  readonly isTelecallerMode = computed(() => this.store.roles().includes(7));
  readonly isSalesExecutiveMode = computed(() => this.store.roles().includes(13));

  constructor() {
    this.store.fetchAllProjects();
    this.setupFormListeners();
    this.applyRoleRestrictions();
  }

  ngAfterViewInit(): void {
  }



  private setupFormListeners(): void {
    // Project ID change listener
    this.addUnitBankerForm.get('project_id')?.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(projectId => {
      this.projectIdSignal.set(projectId);
      this.store.clearReport();
      if (projectId) {
        this.store.loadFilters(projectId);
      } else {
        this.store.clearReport();
      }
    });

    // Initialize signal with current form value
    const initialProjectId = this.addUnitBankerForm.get('project_id')?.value;
    this.projectIdSignal.set(initialProjectId ?? null);

    // Handle role-based restrictions visually
    effect(() => {
      // If roleId is 7 (Telecaller), patch and disable sales_executive_id
      if (this.isTelecallerMode()) {
        this.patchAndDisable('sales_executive_id');
      }
      // If roleId is 13 (Sales Executive), patch and disable telecaller_id
      if (this.isSalesExecutiveMode()) {
        this.patchAndDisable('telecaller_id');
      }
    });
  }

  private applyRoleRestrictions(): void {
    // If roleId is 7 (Telecaller), patch and disable sales_executive_id
    if (this.isTelecallerMode()) {
      this.patchAndDisable('sales_executive_id');
    }
    // If roleId is 13 (Sales Executive), patch and disable telecaller_id
    if (this.isSalesExecutiveMode()) {
      this.patchAndDisable('telecaller_id');
    }
  }

  private patchAndDisable(controlName: string): void {
    const control = this.addUnitBankerForm.get(controlName);
    const userId = this.store.userId();
    if (control && userId) {
      const wasDisabled = control.disabled;
      // Enable temporarily if disabled to allow patching
      if (wasDisabled) {
        control.enable({ emitEvent: false });
      }
      // Patch value with user ID
      control.patchValue([userId], { emitEvent: false });
      // Disable the control
      control.disable({ emitEvent: false });
    }
  }

  fetchDailyDSRReport(): void {
    if (this.addUnitBankerForm.invalid) {
      this.snackBar.open('Please select a project.', 'Close', { duration: 3000 });
      return;
    }

    const rawValues = this.addUnitBankerForm.getRawValue();
    const payload = {
      project_id: rawValues.project_id,
      role_id: this.store.getCalculatedRoleId(),
      telecaller_id: rawValues.telecaller_id?.length ? rawValues.telecaller_id : undefined,
      sales_executive_id: rawValues.sales_executive_id?.length ? rawValues.sales_executive_id : undefined
    };

    this.store.fetchReport(payload);
  }

  async downloadTableAsImage(): Promise<void> {
    const report = this.store.dailyReport();
    if (!report || !this.store.hasAnyData()) {
      this.snackBar.open('No report data available to download.', 'Close', { duration: 3000 });
      return;
    }

    this.isDownloading.set(true);
    try {
      const capturedElement = this.reportContainerRef?.nativeElement;
      if (!capturedElement) throw new Error('Report element not found');

      // Small delay to ensure all styles/fonts are fully resolved
      await new Promise(r => setTimeout(r, 800));

      const width = capturedElement.offsetWidth;
      const height = capturedElement.offsetHeight;

      const imageData = await toPng(capturedElement, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: width,
        height: height,
        cacheBust: true,
        style: { opacity: '1', visibility: 'visible', transform: 'none' }
      });

      const fileName = `${report.project_name?.replace(/\s+/g, '_')}_DSR_${report.date?.replace(/\s+/g, '_')}.png`;
      const link = document.createElement('a');
      link.href = imageData;
      link.download = fileName;
      link.click();

      this.snackBar.open('Report exported successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Download error:', error);
      this.snackBar.open('Failed to export report.', 'Close', { duration: 3000 });
    } finally {
      this.isDownloading.set(false);
    }
  }

  async shareTableAsImage(): Promise<void> {
    const report = this.store.dailyReport();
    if (!report || !this.store.hasAnyData()) {
      this.snackBar.open('No report data available to share.', 'Close', { duration: 3000 });
      return;
    }

    if (!navigator.share) {
      this.snackBar.open('Sharing not supported.', 'Close', { duration: 3000 });
      return;
    }

    this.isDownloading.set(true);
    try {
      const capturedElement = this.reportContainerRef?.nativeElement;
      if (!capturedElement) throw new Error('Report element not found');

      // Small delay to ensure all styles/fonts are fully resolved
      await new Promise(r => setTimeout(r, 800));

      const width = capturedElement.offsetWidth;
      const height = capturedElement.offsetHeight;

      const blob = await toBlob(capturedElement, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: width,
        height: height,
        cacheBust: true,
        style: { opacity: '1', visibility: 'visible', transform: 'none' }
      });

      if (blob) {
        const fileName = `${report.project_name?.replace(/\s+/g, '_')}_DSR_${report.date?.replace(/\s+/g, '_')}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        await navigator.share({
          files: [file],
          title: 'Daily Sales Report',
          text: `DSR Report for ${report.project_name} - ${report.date}`
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        this.snackBar.open('Failed to share report.', 'Close', { duration: 3000 });
      }
    } finally {
      this.isDownloading.set(false);
    }
  }

  private prepareElementForCapture(el: HTMLElement): void {
    // Create a hidden wrapper that keeps the element in the DOM 
    // but prevents it from being seen or affecting layout.
    const wrapper = document.createElement('div');
    wrapper.id = 'capture-wrapper';
    wrapper.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: hidden;
        z-index: -9999;
        pointer-events: none;
    `;

    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    // Initial styles for the element itself
    el.style.visibility = 'visible';
    el.style.opacity = '1';
  }

  private cleanupCapture(el: HTMLElement | null): void {
    const wrapper = document.getElementById('capture-wrapper');
    if (wrapper) {
      wrapper.remove();
    } else if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    this.isDownloading.set(false);
  }

  hasOnlyRoles(roles: number[]): boolean {
    const userRoleId = this.store.roleId();
    return userRoleId ? roles.includes(userRoleId) : false;
  }
}
