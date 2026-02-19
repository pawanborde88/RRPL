import { Component, ViewChild } from '@angular/core';
import { AddQuizzComponent } from '../add-quizz/add-quizz.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { CostomLoadingComponent } from '../../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
@Component({
  selector: 'app-all-quizz',
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
    // Add the pipe here
  ],
  templateUrl: './all-quizz.component.html',
  styleUrl: './all-quizz.component.scss'
})
export class AllQuizzComponent {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  loading: boolean = false;

  dataSource = new MatTableDataSource<any>([]);
  allCompentenceLevel: any[] = [];
  allQuizzes: any[] = [];
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  competency_level_id: number | null = null;
  filteredCount: number = 0;
  searchText: string = '';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //   displayedColumns = [
  //   { key: 'title', label: 'Title' },
  //   { key: 'description', label: 'Description' },
  //   { key: 'publish_date', label: 'Publish Date' },
  //   { key: 'max_attempt', label: 'Max Attempt' },
  //   { key: 'bonus_points', label: 'Bonus Points' },
  //   { key: 'valid_from', label: 'Valid From' },
  //   { key: 'valid_to', label: 'Valid To' },
  //   { key: 'time', label: 'Time' },
  //   { key: 'no_of_days', label: 'No of Days' },
  //   { key: 'created_by', label: 'Created By' },
  //   { key: 'created_at', label: 'Created At' },
  //   { key: 'updated_by', label: 'Updated By' },
  //   { key: 'updated_at', label: 'Updated At' },
  //   { key: 'created_by_string', label: 'Created By' },
  //   { key: 'updated_by_string', label: 'Updated By' },
  //   { key: 'actions', label: 'Actions' } // optional for action buttons
  // ];

  displayedColumns: string[] = [
    'title',
    'description',
    'publish_date',
    'max_attempt',
    'bonus_points',
    'valid_from',
    'valid_to',
    'time',
    'no_of_days',
    'created_by',
    'created_at',
    'updated_by',
    'updated_at',
    // 'created_by_string',
    // 'updated_by_string',
    'actions'
  ];

  //columnKeys: string[] = this.displayedColumns.map(col => col.key);

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchAllCompetencys();
    this.fetchAllQuizz();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) =>
      Object.values(data).some(value =>
        value?.toString().toLowerCase().includes(filter)
      );
  }

  applyFilter(searchText: string) {
    this.dataSource.filter = searchText.trim().toLowerCase();
    this.updateFilteredCount();
  }

  updateFilteredCount(): void {
    this.filteredCount = this.dataSource.filteredData.length;
  }

  fetchAllCompetencys(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/competency_dropdown`).subscribe({
      next: (res: any) => {
        this.allCompentenceLevel = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Unable to fetch Competencies.', 'Close', { duration: 3000 });
      }
    });
  }

  fetchAllQuizz(): void {
  this.loading = true;

  const payload = this.competency_level_id
    ? { competency_level_id: this.competency_level_id }
    : {}; // 👈 Empty payload to fetch all quizzes

  this.http.post(`${this.baseUrl}/fetch_quizzes`, payload).subscribe({
    next: (res: any) => {
      this.allQuizzes = res || [];
      this.dataSource.data = res || [];
      this.updateFilteredCount();
      this.loading = false;
    },
    error: () => {
      this.loading = false;
      this.allQuizzes = [];
      this.snackBar.open('Unable to fetch Quizzes.', 'Close', { duration: 3000 });
    }
  });
}


  deleteQuizz(quizID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Quiz?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
              quiz_id: quizID,
        };
        this.http
          .post(`${this.baseUrl}/delete_quiz`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Quiz deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllQuizz(); // Ensure this is called here to update the teams
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete .', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }

  openAddSiteDialog(row: any): void {
    const apiUrl = row?.site_visit_id ? 'add_revisit' : 'add_site_visit';

    const dialogRef = this.dialog.open(AddQuizzComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: row?.site_visit_id ? 'Add Revisit' : 'Add Site Visit',
        apiUrl: apiUrl,
        successMessage: row?.site_visit_id
          ? 'Revisit added successfully'
          : 'Site Visit added successfully',
        rowData: row, // Pass row data if needed
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllQuizz(); // Refresh the list if data was modified
      }
    });
  }

  openQuizzDialog(action: string, element?: any): void {
    console.log('Element Data:', element);
    const dialogRef = this.dialog.open(AddQuizzComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title:
          action === 'add' ? 'Add Quizz' : 'Edit Quizz',
        apiUrl:
          action === 'add' ? 'add_quiz' : 'edit_quiz',
        successMessage:
          action === 'add'
            ? 'Quizz added successfully'
            : 'Quizz updated successfully',
        rowData: element,
      },


    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllQuizz(); // Refresh the list if data was modified
      }
    });

  }

  openAddQuestionsDialog(element: any): void {
    // Check if quiz_id exists, if not try 'id' property
    const quizId = element.quiz_id || element.id;
    
    if (!quizId) {
      this.snackBar.open('Quiz ID not found. Cannot open questions page.', 'Close', { duration: 3000 });
      return;
    }

    // Navigate to all-questions page with quiz_id and selection mode
    this.router.navigate(['/setup/courses/quiz-questions', quizId], {
      state: { 
        selectionMode: true,
        quiz_id: quizId
      }
    });
  }

  // Search functionality
  get filteredQuizzes(): any[] {
    if (!this.searchText || this.searchText.trim() === '') {
      return this.allQuizzes;
    }

    const searchLower = this.searchText.toLowerCase().trim();

    return this.allQuizzes.filter(quiz => {
      // Search in title
      const titleMatch = quiz.title?.toLowerCase().includes(searchLower);

      // Search in description (remove HTML tags for search)
      const descriptionText = quiz.description?.replace(/<[^>]*>/g, '').toLowerCase();
      const descriptionMatch = descriptionText?.includes(searchLower);

      // Search in created by string (creator name)
      const creatorMatch = quiz.created_by_string?.toLowerCase().includes(searchLower);

      // Search in other fields
      const publishDateMatch = quiz.publish_date?.toLowerCase().includes(searchLower);
      const timeMatch = quiz.time?.toLowerCase().includes(searchLower);
      
      // Search in bonus points (convert to string)
      const bonusPointsMatch = quiz.bonus_points?.toString().includes(searchLower);
      
      // Search in max attempts (convert to string)
      const maxAttemptMatch = quiz.max_attempt?.toString().includes(searchLower);

      return titleMatch || descriptionMatch || creatorMatch || publishDateMatch || timeMatch || bonusPointsMatch || maxAttemptMatch;
    });
  }

  onSearchChange(): void {
    // This method is called on input change, filtering is automatic via getter
  }

  clearSearch(): void {
    this.searchText = '';
  }

}
