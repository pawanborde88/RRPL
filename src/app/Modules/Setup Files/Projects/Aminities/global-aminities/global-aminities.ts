import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { AuthService } from '../../../../../Service/auth.service';
import { CommonService } from '../../../../../Service/common/common.service';
import { PreviewImagesComponent } from '../../preview-images/preview-images.component';
import { MatDialog } from '@angular/material/dialog';
import { AddGlobalAminities } from './add-global-aminities/add-global-aminities';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-global-aminities',
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
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './global-aminities.html',
  styleUrl: './global-aminities.scss',
})
export class GlobalAminities {
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  readonly userId = this.authService.userId;

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly allWingslist = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);

  // Form signal for reactive payload
  private readonly formValues = signal<any>({});


  readonly bookingForm = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null),
  });

  readonly agreementDetailsColumnsNames: (TableColumn & { claimedOnly?: boolean })[] = [
    { key: 'actions', label: 'Actions', type: 'actions', sticky: true },
    { key: 'amenitie_name', label: 'Amenity Name' },
    { key: 'icon_text', label: 'Icon Text' },
    {
      key: 'logo', label: 'Logo',
      type: 'photo',
      nullImage: 'assets/Images/dummy.png',
      clickable: true,
      onClick: (item: any) => this.previewImages(item.logo),
    },
    { key: 'created_by_string', label: 'Created By' },
    { key: 'updated_by_string', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;

    return { filters };
  });

  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  readonly headerButtons = [
    {
      label: 'Add Amenity',
      icon: 'add',
      color: 'primary',
      action: () => this.openAddEditDialog(),
    },
  ];

  readonly amenityActions = [
    { action: 'editAmenity', icon: 'edit', tooltip: 'Edit Amenity', color: 'primary' },
    { action: 'deleteAmenity', icon: 'delete', tooltip: 'Delete Amenity', color: 'warn' },
  ];

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  onAmenityAction(action: string, row: any): void {
    if (action === 'editAmenity') {
      this.openAddEditDialog(row);
    } else if (action === 'deleteAmenity') {
      this.deleteAmenity(row);
    }
  }

  openAddEditDialog(data: any = null): void {
    const dialogRef = this.dialog.open(AddGlobalAminities, {
      width: '400px',
      data: data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable?.refreshData();
      }
    });
  }

  deleteAmenity(row: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `Are you sure you want to delete the amenity "${row.amenitie_name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.commonService.deleteAmenity(row.amenity_id).subscribe({
          next: (res: any) => {
            if (res.success || res.status) {
              this.snackBar.open('Amenity deleted successfully', 'Close', { duration: 3000 });
              this.agGridTable?.refreshData();
            } else {
              this.snackBar.open(res.message || 'Failed to delete amenity', 'Close', { duration: 3000 });
            }
          },
          error: () => {
            this.snackBar.open('Error deleting amenity', 'Close', { duration: 3000 });
          },
        });
      }
    });
  }

  fetchAmenityList(): void {
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }

  previewImages(imageData: any): void {
    const imagesToPreview = imageData
      ? [imageData]
      : ['assets/Images/dummy.png'];

    const dialogRef = this.dialog.open(PreviewImagesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        images: imagesToPreview,
        name: 'Logo',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value);
  }

  private loadInitialData(): void {
    this.commonService.fetchUserProjectDropdown(this.userId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) this.projectsList.set(res);
        },
        error: () => this.showError('Unable to fetch projects.')
      });
  }

  private setupFormSubscriptions(): void {
    this.bookingForm.get('project_id')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((id: any) => !!id)
      )
      .subscribe(projectID => {
        const idToFetch = Array.isArray(projectID) ? (projectID.length === 1 ? projectID[0] : null) : projectID;
        if (idToFetch) {
          this.fetchAllWings(idToFetch);
        } else {
          this.allWingslist.set([]);
        }
        // Reset wing when project changes
        this.bookingForm.get('wing_id')?.setValue(null);
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  fetchAllWings(projectID: any): void {
    this.commonService.fetchWingDropdown(projectID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.allWingslist.set(res);
        },
        error: () => {
          this.showError('Unable to fetch wings.');
        },
      });
  }

  readonly trackByWingId = (_index: number, item: any): number => item.wing_id;
}
