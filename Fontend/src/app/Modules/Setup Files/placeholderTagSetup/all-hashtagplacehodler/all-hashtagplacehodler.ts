import { HttpClient } from '@angular/common/http';
import { Component, computed, signal, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AddEditTagPlaceholders } from '../add-edit-tag-placeholders/add-edit-tag-placeholders';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-all-hashtagplacehodler',
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
})
export class AllHashtagplacehodler {
  baseUrl = environment.API_URL;
  loading = signal(false);
  selectedCourseId = signal<any>(null);

  bookingDisplayedColumns: any[] = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'tag_name', label: 'Tag Name' },
    { key: 'colum_name', label: 'Column Name' },
    { key: 'api_name', label: 'API Name' },
    { key: 'description', label: 'Description' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At' },
  ];

  dashboardData: any;
  usersData: any;
  lectureData: any;
  allCourses: any[] = [];

  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  topCoursesChart: any;
  roleEnrollmentChart: any;
  topLecturesChart: any;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
  }

  ngOnInit(): void {
    this.fetchAllCourses();

  }
  readonly headerButtons = [
    {
      label: 'Add New Tag',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddDemandDialog(null),

    },


  ];

  readonly bookingActions = [
    {
      action: 'OpenViewLadgerReport', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit Tag', // Tooltip text
      color: 'primary', // Optional button color

    },
    {
      action: 'DeleteFloorRise',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete Tag',
    },

  ];
  onBookingAction(action: string, row: any): void {
    if (action === 'OpenViewLadgerReport') {
      this.openAddDemandDialog(row);
    }
    if (action === 'DeleteFloorRise') {
      this.DeleteFloorRise(row.floor_rise_id);
    }
  }
  openAddDemandDialog(row: any) {
    const dialogRef = this.dialog.open(AddEditTagPlaceholders, {
      width: '600px',
      data: { row },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable.refreshData();
      }
    });
  }
  DeleteFloorRise(id: any) {
    this.http.post(`${this.baseUrl}/delete_tag_setup`, { tag_setup_id: id }).subscribe({
      next: (res: any) => {
        this.snackBar.open('Tag Setup Deleted Successfully', 'Close', {
          duration: 2000,
        });
        this.agGridTable.refreshData();
      },
      error: (err) => console.error('Failed to delete floor rise', err)
    });
  }
  fetchAllCourses(): void {
    this.http.get(`${this.baseUrl}/fetch_tag_module`).subscribe({
      next: (res: any) => {
        this.allCourses = res || [];
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }
  readonly getAgGridApiPayload = computed(() => {
    const filters: any = {};

    if (this.selectedCourseId()) {
      filters.module_id = this.selectedCourseId();
    }

    return { filters };
  });

  onCourseChange(event: any): void {
    this.selectedCourseId.set(event);
    if (this.selectedCourseId() && this.agGridTable) {
      setTimeout(() => {
        this.agGridTable.refreshData();
      });
    }
  }

}
