import { Component, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component'
import { TemplateComponent } from '../../../../../Common/template/template.component'
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../../angular-material.module';

@Component({
  selector: 'app-add-questions',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    FormsModule,
    AngularMaterialModule,
    
  ],
  templateUrl: './add-questions.component.html',
  styleUrl: './add-questions.component.scss'
})
export class AddQuestionsComponent implements OnInit {
  baseUrl = environment.API_URL;
  quizzes: any[] = [];
  quizId!: number;
  competencyLevelId: number | null = null; // dropdown selection (should start empty)
  passedCompetencyLevelId: number | null = null; // keep previous page value separately
  allCompetencyLevels: any[] = [];
  loading: boolean = false;

  userChangedDropdown = false; // ✅ Track user interaction

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

 ngOnInit(): void {
  this.route.params.subscribe(params => {
    this.quizId = +params['id'];

    const state = window.history.state;
    this.passedCompetencyLevelId = state?.competency_level_id ?? null;

    this.fetchCompetencyDropdown();
    this.fetchQuizQuestions(); // will not use competencyLevelId
  });
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

 fetchQuizQuestions(): void {
  const payload: any = {
    quiz_id: this.quizId
  };

  if (this.userChangedDropdown && this.competencyLevelId !== null) {
    payload.competency_level_id = this.competencyLevelId;
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
            question_already_present: item.question_already_present
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

  removeFocus(){
    (document.activeElement as HTMLElement)?.blur();
  }

  onSave() {

    const selectedQuestionIds = this.quizzes
    .filter(q => q.question_already_present)
    .map(q => q.question_id); // we need question_id in object

  if (selectedQuestionIds.length === 0) {
    this.snackBar.open('Please select at least one question.', 'Close', { duration: 3000 });
    return;
  }

  const payload = {
    quiz_id: [this.quizId],
    question_id: selectedQuestionIds
  };

  this.http.post(`${this.baseUrl}/add_bulk_quiz_question`, payload).subscribe({
    next: (res: any) => {
      if (res?.success) {
        this.snackBar.open(res.message || 'Questions saved successfully!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Something went wrong while saving.', 'Close', { duration: 3000 });
      }
    },
    error: () => {
      this.snackBar.open('Error saving questions.', 'Close', { duration: 3000 });
    }
  });
    
  }

}
