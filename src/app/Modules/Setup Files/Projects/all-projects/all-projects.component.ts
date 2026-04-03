import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../../Service/common/common.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AllAssignedProjectsComponent } from '../All assigned Projects/all-assigned-projects/all-assigned-projects.component';
import { AddProjectsComponent } from '../add-projects/add-projects.component';
import { ProjectWiseTemplateComponent } from '../project-wise-template/project-wise-template.component';
import { ParkingTypesDialogComponent } from '../Parking Types/parking-types-dialog/parking-types-dialog.component';
import { WhatsAppintegrationDialogComponent } from '../../whatsApp/WhatsApp Integration/whats-appintegration-dialog/whats-appintegration-dialog.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { AuthService } from '../../../../Service/auth.service';
import { ProjectOwner } from '../project-owner/project-owner';
import * as XLSX from 'xlsx';

interface ProjectSelection {
  project_id: number;
  project_code?: string;
  property_name?: string;
  project_logo?: string;
  pricing_desc?: string;
  project_status?: string;
  description?: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  pincode?: string;
  created_by_name?: string;
  created_at?: string | Date;
  updated_by_name?: string;
  updated_at?: string | Date;
}

type ProjectRecord = ProjectSelection & { __isSelected?: boolean };

@Component({
  selector: 'app-all-projects',
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
    CostomLoadingComponent,
  ],
  templateUrl: './all-projects.component.html',
  styleUrl: './all-projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllProjectsComponent implements OnInit {
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  searchText = '';

  private readonly loadingSignal = signal(false);
  private readonly projectsSignal = signal<ProjectRecord[]>([]);
  private readonly searchSignal = signal('');
  private readonly selectedProjectIdSignal = signal<number | null>(null);

  readonly filteredProjectsSignal = computed(() => {
    const term = this.searchSignal()
      ?.toString()
      .trim()
      .toLowerCase();
    if (!term) {
      return this.projectsSignal();
    }
    return this.projectsSignal().filter((project) => this.isProjectMatch(project, term));
  });

  readonly selectedProjectsSignal = computed<ProjectSelection[]>(() => {
    const selectedId = this.selectedProjectIdSignal();
    if (!selectedId) {
      return [];
    }
    return this.projectsSignal()
      .filter((project) => project.project_id === selectedId)
      .map((project) => this.sanitizeProject(project));
  });

  readonly totalProjectsSignal = computed(() => this.projectsSignal().length);
  readonly filteredCountSignal = computed(() => this.filteredProjectsSignal().length);
  readonly selectedCountSignal = computed(() => this.selectedProjectsSignal().length);

  readonly roleId = Number(sessionStorage.getItem('role_id'));
  readonly userId = Number(sessionStorage.getItem('session_id'));

  ngOnInit(): void {
    this.fetchAllProjects();
  }

  get loading(): boolean {
    return this.loadingSignal();
  }

  get projectsList(): ProjectRecord[] {
    return this.projectsSignal();
  }

  get filteredProjects(): ProjectRecord[] {
    return this.filteredProjectsSignal();
  }

  get selectedProjects(): ProjectSelection[] {
    return this.selectedProjectsSignal();
  }

  get totalProjects(): number {
    return this.totalProjectsSignal();
  }

  get filteredCount(): number {
    return this.filteredCountSignal();
  }

  get selectedCount(): number {
    return this.selectedCountSignal();
  }

  private setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  headerButtons: Array<{
    label: string;
    shortLabel?: string;
    icon: string;
    color: 'primary' | 'accent' | 'warn';
    variant: 'compact' | 'cta';
    disabled: () => boolean;
    action: () => void;
    show: () => boolean;
  }> = [
    {
      label: 'WhatsApp Key',
      shortLabel: 'WhatsApp',
      icon: 'dataset_linked',
      color: 'primary',
      variant: 'compact',
      disabled: () => !this.selectedProjects.length,
      action: () => this.whatsAppKeyDialog(this.selectedProjects),
      show: () => true,
    },
    {
      label: 'Parking Type',
      shortLabel: 'Parking',
      icon: 'local_parking',
      color: 'primary',
      variant: 'compact',
      disabled: () => !this.selectedProjects.length,
      action: () => this.parkingTypeDialog(this.selectedProjects),
      show: () => true,
    },
    {
      label: 'File Format',
      shortLabel: 'Format',
      icon: 'api',
      color: 'primary',
      variant: 'compact',
      disabled: () => !this.selectedProjects.length,
      action: () => this.openHTMLTemplateDialog(this.selectedProjects),
      show: () => true,
    },
    {
      label: 'Owner Details',
      shortLabel: 'Owner',
      icon: 'qr_code_scanner',
      color: 'primary',
      variant: 'compact',
      disabled: () => !this.selectedProjects.length,
      action: () => this.openOwnerDialog(this.selectedProjects),
      show: () => true,
    },
    // {
    //   label: 'Project Delete Log',
    //   icon: 'delete',
    //   color: 'primary',
    //   disabled: () => false,
    //   action: () =>
    //     this.router.navigate(['/delete-logs'], {
    //       state: {
    //         api: 'project_delete_history',
    //         message: 'All Project Delete Log',
    //       },
    //     }),
    //   show: () => [1, 2, 4].includes(this.roleId), // Only show for specific roles
    // },
    {
      label: 'Add New Project',
      icon: 'add_circle',
      color: 'primary',
      variant: 'cta',
      disabled: () => false,
      action: () => this.openAddProjectDialog(),
      show: () => true,
    },
  ];
  projectActions = [
    {
      icon: 'add_circle',
      label: 'Assign',
      tooltip: 'Assign Project',
      action: 'leadAssign',
      color: 'primary',
      show: () => this.roleId === 2,
    },
    {
      icon: 'edit',
      label: 'Edit',
      tooltip: 'Edit Project',
      action: 'editProject',
      color: 'primary',
      show: () => this.roleId === 2 || this.roleId === 14,
    }
  ];
  readonly permissionData = sessionStorage.getItem('permission') || '';
  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.fetchAllAssignedProjects(row);
        break;
      case 'editProject':
        this.navigateToEditProject(row);
        break;
      case 'deleteProject':
        this.deleteProject(row.project_id);
        break;
      default:
        break;
    }
  }
  // In all-projects.component.ts
  navigateToEditProject(row: any): void {
    // Remove the project_name from the route parameters
    this.router.navigate(['/setup/edit-project', row.project_id]);
  }

  fetchAllProjects(): void {
    this.setLoading(true);
    this.commonService
      .fetchProjects(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any[]) => {
          const projects = Array.isArray(res) ? res : [];
          this.projectsSignal.set(
            projects.map((project: ProjectRecord) => ({
              ...project,
              __isSelected: false,
            }))
          );
          this.selectedProjectIdSignal.set(null);
          this.setLoading(false);
        },
        error: (err: unknown) => {
          console.error(err);
          this.setLoading(false);
          this.snackBar.open('Unable to fetch project details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  deleteProject(projectID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Project?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const reason = result.reason; // Get the reason from the dialog response

        let requestPayload = {
          project_id: projectID,
          reason: reason, // Set the reason from the dialog
          created_by: this.userId, // Set created_by value here
        };

        this.commonService
          .deleteProject(requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Project deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllProjects(); // refresh list post-deletion
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Team.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
  toggleSelection(isChecked: boolean, project: ProjectRecord): void {
    if (!project || !project.project_id) {
      console.error('Invalid project data');
      return;
    }

    const projectToSelect = isChecked ? project : null;
    this.selectProject(projectToSelect);
  }

  toggleAll(event: MatCheckboxChange): void {
    const isChecked = event.checked;
    const projectToSelect = isChecked
      ? this.filteredProjects.find((proj) =>
        this.selectedProjects.some((selected) => selected.project_id === proj.project_id)
      ) ?? this.filteredProjects[0]
      : null;

    this.selectProject(projectToSelect ?? null);
  }

  isAllSelected(): boolean {
    return this.selectedCount === 1;
  }

  isProjectSelected(project: ProjectRecord): boolean {
    return !!project.__isSelected;
  }

  trackByProjectId(index: number, project: ProjectRecord): number {
    return project.project_id;
  }

  onSearchInput(term: string): void {
    this.searchText = term;
    this.searchSignal.set(term);
  }

  clearSearch(): void {
    this.searchText = '';
    this.searchSignal.set('');
  }

  /** Exports the current filtered project list to an .xlsx file (same rows as on screen). */
  exportProjectsToExcel(): void {
    const rows = this.filteredProjects;
    if (!rows.length) {
      this.snackBar.open('No projects to export.', 'Close', { duration: 3000 });
      return;
    }

    try {
      const exportData = rows.map((p) => ({
        'Project ID': p.project_id,
        'Project Code': this.exportCellText(p.project_code),
        'Property Name': this.exportCellText(p.property_name),
        'Status': this.exportCellText(p.project_status),
        'Address': this.exportCellText(p.address),
        'City': this.exportCellText(p.city_name),
        'State': this.exportCellText(p.state_name),
        'Pincode': this.exportCellText(p.pincode),
        'Pricing': this.exportCellText(p.pricing_desc),
        'Description': this.exportCellText(p.description),
        'Created By': this.exportCellText(p.created_by_name),
        'Created At': this.exportCellDate(p.created_at),
        'Updated By': this.exportCellText(p.updated_by_name),
        'Updated At': this.exportCellDate(p.updated_at),
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const maxWidth = 55;
      const minWidth = 12;
      const keys = Object.keys(exportData[0] ?? {});
      ws['!cols'] = keys.map((key) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map((row) => String((row as Record<string, unknown>)[key] ?? '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, minWidth), maxWidth) };
      });

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Projects');

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
      const suffix = this.searchText?.trim() ? '_filtered' : '';
      XLSX.writeFile(wb, `Projects_Export${suffix}_${dateStr}_${timeStr}.xlsx`);

      this.snackBar.open(`Downloaded ${rows.length} project(s) as Excel.`, 'Close', {
        duration: 3500,
      });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Could not create Excel file. Please try again.', 'Close', {
        duration: 4000,
      });
    }
  }

  private exportCellText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    const s = String(value).trim();
    return s;
  }

  private exportCellDate(value: string | Date | undefined | null): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private isProjectMatch(project: ProjectRecord, term: string): boolean {
    return [
      project.property_name,
      project.project_code,
      project.project_status,
      project.address,
      project.city_name,
      project.state_name,
      project.pincode,
      project.pricing_desc,
      project.description,
      project.created_by_name,
      project.updated_by_name,
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .some((value) => value.toLowerCase().includes(term));
  }

  private selectProject(project: ProjectRecord | null): void {
    const selectedId = project?.project_id ?? null;
    this.selectedProjectIdSignal.set(selectedId);
    this.projectsSignal.update((list) =>
      list.map((item) => ({
        ...item,
        __isSelected: selectedId !== null && item.project_id === selectedId,
      }))
    );
  }

  private sanitizeProject(project: ProjectRecord): ProjectSelection {
    const { __isSelected, ...rest } = project;
    return rest;
  }

  getProjectLogo(project: ProjectRecord): string {
    if (!project || !project.project_logo) {
      return 'assets/Images/dummy.png';
    }
    return `${this.storageUrl ?? ''}/${project.project_logo}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/Images/dummy.png';
    }
  }

  getProjectInitial(project: ProjectRecord): string {
    const name = project?.property_name?.trim() || project?.project_code?.trim() || '';
    return name ? name.charAt(0).toUpperCase() : 'P';
  }

  getStatusBadgeClasses(status?: string | null): string {
    const baseClasses =
      'inline-flex max-w-full min-w-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide leading-tight transition-all duration-300';
    if (!status) {
      return `${baseClasses} bg-slate-100/80 text-slate-600 border-slate-200`;
    }

    const normalized = status.toString().trim().toLowerCase();
    switch (normalized) {
      case 'active':
      case 'running':
      case 'continue':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm`;
      case 'upcoming':
      case 'scheduled':
        return `${baseClasses} bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm`;
      case 'on hold':
      case 'paused':
        return `${baseClasses} bg-amber-50 text-amber-800 border-amber-200 shadow-sm`;
      case 'completed':
      case 'closed':
      case 'sold':
        return `${baseClasses} bg-slate-100 text-slate-800 border-slate-200 shadow-sm`;
      case 'cancelled':
      case 'canceled':
        return `${baseClasses} bg-rose-50 text-rose-700 border-rose-200 shadow-sm`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200 shadow-sm`;
    }
  }


  getStatusChipClasses(status?: string | null): string {
    if (!status) {
      return '!bg-slate-200 !text-slate-700';
    }

    const normalized = status.toString().trim().toLowerCase();
    switch (normalized) {
      case 'active':
      case 'running':
        return '!bg-emerald-100 !text-emerald-700';
      case 'upcoming':
      case 'scheduled':
        return '!bg-indigo-100 !text-indigo-700';
      case 'on hold':
      case 'paused':
        return '!bg-amber-100 !text-amber-700';
      case 'completed':
      case 'closed':
        return '!bg-slate-200 !text-slate-700';
      case 'cancelled':
      case 'canceled':
        return '!bg-rose-100 !text-rose-700';
      default:
        return '!bg-sky-100 !text-sky-700';
    }
  }

  openOwnerDialog(project: ProjectRecord | ProjectSelection[]): void {
    const data = Array.isArray(project) ? project : [project];
    const dialogRef = this.dialog.open(ProjectOwner, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { rowData: data },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Handle result if needed
    });
  }
  openHTMLTemplateDialog(selectedRows: any): void {
    const dialogRef = this.dialog.open(ProjectWiseTemplateComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { rowData: selectedRows },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Handle result if needed
    });
  }
  parkingTypeDialog(selectedRows: any): void {
    const dialogRef = this.dialog.open(ParkingTypesDialogComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { rowData: selectedRows },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Handle result if needed
    });
  }
  whatsAppKeyDialog(selectedRows: any): void {
    const dialogRef = this.dialog.open(WhatsAppintegrationDialogComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { rowData: selectedRows },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Handle result if needed
    });
  }
  fetchAllAssignedProjects(data: {
    project_id: number;
    property_name: string;
  }): void {
    const dialogRef = this.dialog.open(AllAssignedProjectsComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        project_id: data.project_id,
        project_name: data.property_name,
        apiUrl: 'assign_project', // Keeping apiUrl inside data
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Handle result if needed
    });
  }

  openAddProjectDialog(): void {
    const dialogRef = this.dialog.open(AddProjectsComponent, {
      minWidth: '70vw',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Refresh the projects list if a project was added
        this.fetchAllProjects();
      }
    });
  }
}
