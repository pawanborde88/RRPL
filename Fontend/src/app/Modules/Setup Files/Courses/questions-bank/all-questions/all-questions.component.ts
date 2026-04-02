import { Component } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { MatDialog } from '@angular/material/dialog';
import { QuestionFormComponent } from '../question-form/question-form.component';
import { CostomLoadingComponent } from '../../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-all-questions',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    FormsModule,
    AngularMaterialModule,
    CostomLoadingComponent
  ],
  templateUrl: './all-questions.component.html',
  styleUrl: './all-questions.component.scss'
})
export class AllQuestionsComponent {
  baseUrl = environment.API_URL;
  quizzes: any[] = [];
  quizId!: number;
  competencyLevelId: number | null = null; // dropdown selection (should start empty)
  passedCompetencyLevelId: number | null = null; // keep previous page value separately
  allCompetencyLevels: any[] = [];
  loading: boolean = false;
  allCategories: any[] = [];
  categoryId: number | null = null;
  searchText: string = '';
  selectionMode: boolean = false; // Flag to check if in selection mode

  userChangedDropdown = false; // ✅ Track user interaction

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.quizId = +params['quiz_id'];

      const state = window.history.state;
      this.passedCompetencyLevelId = state?.competency_level_id ?? null;
      this.selectionMode = state?.selectionMode ?? false; // Check if in selection mode
    });

    this.fetchCompetencyDropdown();
    this.fetchCategoryDropdown();
    this.fetchQuizQuestions();
  }


  fetchCompetencyDropdown(): void {
    this.http.get(`${this.baseUrl}/competency_dropdown`).subscribe({
      next: (res: any) => {
        this.allCompetencyLevels = res;
      },
      error: () => {
        this.snackBar.open('Failed to load competency levels', 'Close', {
          duration: 3000
        });
      }
    });
  }

  fetchCategoryDropdown(): void {
  this.http.get(`${this.baseUrl}/category_dropdown`).subscribe({
    next: (res: any) => {
      this.allCategories = res;
    },
    error: () => {
      this.snackBar.open('Failed to load categories', 'Close', {
        duration: 3000
      });
    }
  });
}


  fetchQuizQuestions(): void {
    const payload: any = {
      quiz_id: this.quizId
    };

    if (this.userChangedDropdown && this.competencyLevelId !== null) {
      payload.competency_level_id = this.competencyLevelId;
    }

    if (this.categoryId !== null) {
    payload.category_id = this.categoryId; 
  }

    this.loading = true;

    this.http.post(`${this.baseUrl}/quiz_questions`, payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.quizzes = res?.success && res.data?.length > 0
          ? res.data.map((item: any) => ({
            question_id: item.question_id,
            question_text: item.question_text,
            points: item.points,
            created_by_string: item.created_by_string,
            question_already_present: item.question_already_present,
            option: item.option
          }))
          : [];
      },
      error: () => {
        this.loading = false;
        this.quizzes = [];
        this.snackBar.open('Failed to load questions', 'Close', {
          duration: 3000
        });
      }
    });
  }


  // ✅ Track user action
  onCompetencyChange(): void {
    this.userChangedDropdown = true;
    this.fetchQuizQuestions();
  }

  openAddModal() {
    const dialogRef = this.dialog.open(QuestionFormComponent, {
      minWidth: '40vw',
      maxWidth: '30vh',
      maxHeight: '80vh',
      data: null, // no data means add mode
      restoreFocus: false 
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchQuizQuestions();
      }
    });
  }

  openEditModal(question: any) {
    const dialogRef = this.dialog.open(QuestionFormComponent, {
      minWidth: '40vw',
      maxWidth: '30vh',
      maxHeight: '80vh',
      data: question, // pass the question data for edit mode
      restoreFocus: false 
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchQuizQuestions();
      }
    });
  }

  onCategoryChange() {
    this.fetchQuizQuestions();
  }

  deleteQuestion(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Question?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          question_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_quiz_question`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Question deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchQuizQuestions(); // Ensure this is called here to update the teams
            },
            error: (err: any) => {
            this.snackBar.open('Unable to Delete Question.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }

getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  get filteredQuizzes(): any[] {
    if (!this.searchText || this.searchText.trim() === '') {
      return this.quizzes;
    }

    const searchLower = this.searchText.toLowerCase().trim();

    return this.quizzes.filter(question => {
      // Search in question text
      const questionMatch = question.question_text?.toLowerCase().includes(searchLower);

      // Search in options
      const optionsMatch = question.option?.some((opt: any) => 
        opt.option_text?.toLowerCase().includes(searchLower)
      );

      // Search in created by
      const creatorMatch = question.created_by_string?.toLowerCase().includes(searchLower);

      return questionMatch || optionsMatch || creatorMatch;
    });
  }

  onSearchChange(): void {
    // This method is called on input change, filtering is automatic via getter
  }

  clearSearch(): void {
    this.searchText = '';
  }

  removeFocus(): void {
    // Remove focus from the checkbox to prevent styling issues
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  onSave(): void {
    const selectedQuestionIds = this.quizzes
      .filter(q => q.question_already_present)
      .map(q => q.question_id);

    if (selectedQuestionIds.length === 0) {
      this.snackBar.open('Please select at least one question.', 'Close', { duration: 3000 });
      return;
    }

    const payload = {
      quiz_id: [this.quizId],
      question_id: selectedQuestionIds
    };

    this.loading = true;

    this.http.post(`${this.baseUrl}/add_bulk_quiz_question`, payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          this.snackBar.open(res.message || 'Questions saved successfully!', 'Close', { duration: 3000 });
          // Navigate back to the previous page
          this.location.back();
        } else {
          this.snackBar.open('Something went wrong while saving.', 'Close', { duration: 3000 });
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error saving questions.', 'Close', { duration: 3000 });
      }
    });
  }

  cancelSelection(): void {
    // Navigate back to the previous page
    this.location.back();
  }

}
