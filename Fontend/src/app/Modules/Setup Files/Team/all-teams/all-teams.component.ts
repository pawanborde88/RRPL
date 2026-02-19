import { Component, ViewChild, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { AddTeamsComponent } from '../add-teams/add-teams.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TeamStore } from '../store/team.store';
import { TeamService } from '../services/team.service';
import { catchError, filter, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-all-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    TruncatePipe,
    ConfigurableAgGridDataComponent
  ],
  templateUrl: './all-teams.component.html',
  styleUrls: ['./all-teams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllTeamsComponent {
  readonly store = inject(TeamStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly teamService = inject(TeamService);

  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  readonly apiEndpoint = 'fetch_team_details';
  readonly apiMethod = 'POST';
  readonly apiPayload = computed(() => ({
    account_id: this.store.userId()
  }));

  readonly columns: TableColumn[] = [
    { key: 'team_name', label: 'Team Name' },
    { key: 'manager', label: 'Manager' },
    { key: 'members', label: 'Members' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions', sticky: true }
  ];

  readonly teamActions = [
    {
      action: 'editTeam',
      icon: 'edit_note',
      tooltip: 'Edit Team',
      color: 'primary',
      show: () => [1, 2, 4].includes(this.store.roleId())
    },
    {
      action: 'deleteTeam',
      icon: 'delete',
      tooltip: 'Delete Team',
      color: 'warn',
      show: () => [1, 2, 4].includes(this.store.roleId())
    }
  ];

  readonly headerButtons = [
    {
      label: 'Add Team',
      icon: 'add_circle',
      color: 'primary',
      action: () => this.openAddTeam(),
      show: () => true
    }
  ];

  refreshGrid() {
    this.agGridComponent?.refreshData();
  }

  onActionClick(event: { action: string, row: any }) {
    if (event.action === 'editTeam') {
      this.openEditTeam(event.row);
    } else if (event.action === 'deleteTeam') {
      this.deleteTeam(event.row.team_id);
    }
  }

  openAddTeam() {
    this.dialog.open(AddTeamsComponent, {
      autoFocus: false,
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
    }).afterClosed().subscribe((result: boolean) => {
      if (result) this.refreshGrid();
    });
  }

  openEditTeam(row: any): void {
    this.dialog.open(AddTeamsComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: row,
    }).afterClosed().subscribe((result) => {
      if (result) this.refreshGrid();
    });
  }

  deleteTeam(teamId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this team?' },
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap(() => this.store.deleteTeam(teamId))
    ).subscribe((res) => {
      if (res !== null) this.refreshGrid();
    });
  }
}
