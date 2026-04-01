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
import { ProjectwiseQRComponent } from '../QRCODE/projectwise-qr/projectwise-qr.component';
import { AllAssignedProjectsComponent } from '../All assigned Projects/all-assigned-projects/all-assigned-projects.component';
import { AddProjectsComponent } from '../add-projects/add-projects.component';
import { ProjectWiseTemplateComponent } from '../project-wise-template/project-wise-template.component';
import { ParkingTypesDialogComponent } from '../Parking Types/parking-types-dialog/parking-types-dialog.component';
import { WhatsAppintegrationDialogComponent } from '../../whatsApp/WhatsApp Integration/whats-appintegration-dialog/whats-appintegration-dialog.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { AuthService } from '../../../../Service/auth.service';

interface ProjectSelection {
  project_id: number;
  project_code?: string;
  property_name?: string;
  project_logo?: string;
  pricing_desc?: string;
  project_status?: string;
  description?: string;
  address?: string;
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

  headerButtons = [
    {
      label: 'WhatsApp Key',
      icon: 'dataset_linked',
      color: 'primary',
      disabled: () => !this.selectedProjects.length,
      action: () => this.whatsAppKeyDialog(this.selectedProjects),
      show: () => true,
    },
    {
      label: 'Parking Type',
      icon: 'local_parking',
      color: 'primary',
      disabled: () => !this.selectedProjects.length,
      action: () => this.parkingTypeDialog(this.selectedProjects),
      show: () => true,
    },
    {
      label: 'File Format',
      icon: 'api',
      color: 'primary',
      disabled: () => !this.selectedProjects.length,
      action: () => this.openHTMLTemplateDialog(this.selectedProjects),
      show: () => true,
    },
    {
      label: 'Generate QR',
      icon: 'qr_code_scanner',
      color: 'primary',
      disabled: () => !this.selectedProjects.length,
      action: () => this.openQRDialog(this.selectedProjects),
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

  private isProjectMatch(project: ProjectRecord, term: string): boolean {
    return [
      project.property_name,
      project.project_code,
      project.project_status,
      project.address,
      project.pricing_desc,
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
      'inline-flex items-center transition-all duration-300';
    if (!status) {
      return `${baseClasses} bg-slate-100/80 text-slate-600 border-slate-200`;
    }

    const normalized = status.toString().trim().toLowerCase();
    switch (normalized) {
      case 'active':
      case 'running':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]`;
      case 'upcoming':
      case 'scheduled':
        return `${baseClasses} bg-indigo-50 text-indigo-700 border-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.1)]`;
      case 'on hold':
      case 'paused':
        return `${baseClasses} bg-amber-50 text-amber-700 border-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]`;
      case 'completed':
      case 'closed':
        return `${baseClasses} bg-slate-100 text-slate-700 border-slate-200`;
      case 'cancelled':
      case 'canceled':
        return `${baseClasses} bg-rose-50 text-rose-700 border-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.1)]`;
      default:
        return `${baseClasses} bg-sky-50 text-sky-700 border-sky-100`;
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

  openQRDialog(project: ProjectRecord | ProjectSelection[]): void {
    const data = Array.isArray(project) ? project : [project];
    const dialogRef = this.dialog.open(ProjectwiseQRComponent, {
      minWidth: '20vw',
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
