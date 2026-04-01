import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddEditEmailTemplateDialog } from '../add-edit-email-template-dialog/add-edit-email-template-dialog';
import { TagPlaceholderStore } from '../../tag-placeholder.store';

@Component({
  selector: 'app-allmail-templates',
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
  templateUrl: './allmail-templates.html',
  styleUrl: './allmail-templates.scss',
})
export class AllmailTemplates {
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
    { key: 'project_name', label: 'Project Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Email Body' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At' },
  ];

  readonly headerButtons = [
    {
      label: 'Add Email Templates',
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
      tooltip: 'Edit Email Templates',
      color: 'primary',
    },
    {
      action: 'DeleteTag',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Email Templates',
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
        this.deleteTagPlaceholder(row.email_template_setup_id);
        break;
    }
  }

  openAddEditDialog(row: any) {
    const dialogRef = this.dialog.open(AddEditEmailTemplateDialog, {
      width: '700px',
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
        this.http.post(`${this.baseUrl}/delete_email_template`, {
          email_template_setup_id: id
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
