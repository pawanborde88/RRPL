import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AddTeamsComponent } from '../add-teams/add-teams.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReusableTableComponent,
    TemplateComponent,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './all-teams.component.html',
  styleUrls: ['./all-teams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllTeamsComponent implements OnInit, AfterViewInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly loading = signal<boolean>(false);

  dataSource = new MatTableDataSource<any>();
  readonly allTeamList = signal<any[]>([]);

  readonly roleId = Number(sessionStorage.getItem('role_id'));
  readonly userId = Number(sessionStorage.getItem('session_id'));

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;


  ngOnInit(): void {
    this.fetchAllTeams();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  displayedColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: '',
      type: 'index',
    },
    { key: 'team_name', label: 'Team Name' },
    { key: 'manager', label: 'Manager' },
    { key: 'members', label: 'Members' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  displayedColumnKeys = this.displayedColumns.map((col) => col.key);

  fetchAllTeams(): void {
    this.loading.set(true);
    this.http.post(`${this.baseUrl}/fetch_team_details`, { account_id: this.userId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.dataSource.data = res || [];
          this.allTeamList.set(res || []);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error(err);
          this.loading.set(false);
          this.snackBar.open('Unable to fetch team details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  openAddTeam() {
    this.dialog
      .open(AddTeamsComponent, {
        autoFocus: false,
        minWidth: '50vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
      })
      .afterClosed()
      .subscribe((result: boolean | undefined) => {
        if (result) {
          this.fetchAllTeams();
        }
      });
  }

  openEditTeam(row: any): void {
    const dialogRef = this.dialog.open(AddTeamsComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: row, // Pass the selected row data
    });

    dialogRef
      .afterClosed()
      .subscribe((result: boolean | undefined) => {
        if (result) {
          this.fetchAllTeams(); // Refresh the team list if data was modified
        }
      });
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Source',
      action: 'leadAssign',
      color: 'primary',
      show: () => [1, 2, 4].includes(this.roleId), // Only show for specific roles
    },
    {
      icon: 'delete',
      tooltip: 'Delete Project',
      action: 'deleteProject',
      color: 'warn',
      show: () => [1, 2, 4].includes(this.roleId), // Only show for specific roles
    },
  ];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.openEditTeam(row);

        break;
      case 'deleteProject':
        this.deleteTeam(row.team_id);
        break;
      default:
        break;
    }
  }
  selectedProjects: any[] = [];

  toggleSelection(isChecked: boolean, row: any): void {
    if (!row || !row.project_id) {
      console.error('Invalid row data');
      return;
    }

    if (isChecked) {
      if (!this.selectedProjects.some((p) => p.user_id === row.user_id)) {
        this.selectedProjects.push({ ...row }); // Add a copy of the project
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(
        (p) => p.user_id !== row.user_id
      );
    }

    console.log('Selected Projects:', this.selectedProjects);
  }
  deleteTeam(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete team?' },
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        let requestPayload = {
          team_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_team`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Team deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllTeams(); // Ensure this is called here to update the teams
            },
            error: (err: unknown) => {
              console.error(err);
              this.snackBar.open('Unable to Delete Team.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
