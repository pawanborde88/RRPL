import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddPhaseComponent } from '../../add-phase/add-phase.component';
import { AddFloorUnitComponent } from '../add-floor-unit/add-floor-unit.component';

@Component({
  selector: 'app-all-floor-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe, // Add the pipe here
  ],
  templateUrl: './all-floor-list.component.html',
  styleUrl: './all-floor-list.component.scss'
})
export class AllFloorListComponent {
  @Input() projectID!: string;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  projectData: any = {};
  roleId = Number(sessionStorage.getItem('role_id')) || null;
  userId = Number(sessionStorage.getItem('session_id')) || null;
  allConfiguration: any[] = [];
  allProjectSpecifiationList: any[] = [];
  allFloorUnits: any[] = [];
  selectedVariant: string = '';

  ngOnInit(): void {
    this.fetchAllFloors();
  }
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private route: ActivatedRoute
  ) {}

  openFloorUnitDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddFloorUnitComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Floor' : 'Edit Floor',
        apiUrl:
          action === 'add'
            ? 'add_floor'
            : 'edit_floor',
        successMessage:
          action === 'add'
            ? 'Floor added successfully'
            : 'Floor updated successfully',
        rowData: row,
        projectid: this.projectID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.fetchAllFloors();
    });
  }

  fetchAllFloors(): void {
    this.http
      .post(`${this.baseUrl}/fetch_floors`, {
        project_id: this.projectID,
      })
      .subscribe({
        next: (res: any) => {
          this.allFloorUnits = res;
        },
        error: () => {
          this.snackBar.open(
            'Unable to fetch project phase.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
  }

  deletePhase(phaseID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this Phase?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_phase`, {
            phase_id: phaseID,
          })
          .subscribe({
            next: (data: any) => {
              this.snackBar.open(
                ` Phase icon deleted successfully`,
                'Close',
                {
                  duration: 3000,
                }
              );
              this.fetchAllFloors();
            },
            error: (err: any) => {
              console.error(err);
              this.snackBar.open('Unable to delete the image.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
