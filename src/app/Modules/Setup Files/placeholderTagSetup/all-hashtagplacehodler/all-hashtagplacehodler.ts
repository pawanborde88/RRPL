import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { environment } from '../../../../../environments/environment';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AddEditTagPlaceholders } from '../add-edit-tag-placeholders/add-edit-tag-placeholders';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TagPlaceholderStore } from '../tag-placeholder.store';

@Component({
  selector: 'app-all-hashtagplacehodler',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ConfigurableAgGridDataComponent,
    AutocompleteReusableComponent
  ],
  templateUrl: './all-hashtagplacehodler.html',
  styleUrl: './all-hashtagplacehodler.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllHashtagplacehodler implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(TagPlaceholderStore);

  private readonly baseUrl = environment.API_URL;

  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  readonly modules = this.store.modules;
  readonly loading = this.store.isLoading;
  readonly selectedModuleId = signal<number | null>(null);

  readonly bookingDisplayedColumns = [
    { key: 'actions', label: 'Actions', type: 'actions', sticky: true, disabled: false },
    { key: 'module_name', label: 'Module Name' },
    { key: 'tag_name', label: 'Tag Name' },
    { key: 'colum_name', label: 'Column Name' },
    { key: 'description', label: 'Description' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At' },
  ];

  readonly headerButtons = [
    {
      label: 'Add New Tag',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddEditDialog(null),
    },
  ];

  readonly bookingActions = [
    {
      action: 'EditTag',
      icon: 'edit_note',
      tooltip: 'Edit Tag',
      color: 'primary',
    },
    {
      action: 'DeleteTag',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Tag',
    },
  ];

  readonly getAgGridApiPayload = computed(() => {
    const filters: any = {};
    if (this.selectedModuleId()) {
      filters.module_id = this.selectedModuleId();
    }
    return { filters };
  });

  ngOnInit(): void {
    // Modules are already being fetched by the store on construction
  }

  onBookingAction(action: string, row: any): void {
    switch (action) {
      case 'EditTag':
        this.openAddEditDialog(row);
        break;
      case 'DeleteTag':
        this.deleteTagPlaceholder(row.tag_setup_id);
        break;
    }
  }

  openAddEditDialog(row: any) {
    const dialogRef = this.dialog.open(AddEditTagPlaceholders, {
      width: '600px',
      data: { row },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable?.refreshData();
      }
    });
  }

  deleteTagPlaceholder(id: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: `Are you sure you want to delete this Tag Placeholder?` },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.http.post(`${this.baseUrl}/delete_tag_setup`, {
          tag_setup_id: id
        }).subscribe({
          next: () => {
            this.showSnackBar('Tag Placeholder deleted successfully.');
            this.agGridTable?.refreshData();
          },
          error: () => this.showSnackBar('Unable to delete Tag Placeholder.'),
        });
      }
    });
  }

  onModuleChange(moduleId: any): void {
    this.selectedModuleId.set(moduleId);
    // AgGrid should pick up the change via computed apiPayload
    // But we might need to trigger refresh if it doesn't watch the payload signal
    setTimeout(() => {
      this.agGridTable?.refreshData();
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
