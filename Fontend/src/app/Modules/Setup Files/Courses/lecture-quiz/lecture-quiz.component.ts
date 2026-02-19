import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-lecture-quiz',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    AngularMaterialModule,
    FormsModule
  ],
  templateUrl: './lecture-quiz.component.html',
  styleUrl: './lecture-quiz.component.scss'
})
export class LectureQuizComponent implements OnInit {

  baseUrl = environment.API_URL;
  quizId!: number;
  questions: any[] = [];
  quizTitle: string = 'Lecture Quiz'; // Default title
  selectedAnswers: { [key: number]: number } = {};
  loading: boolean = false; // Initialize loading state
  userId = Number(sessionStorage.getItem('session_id'));
  lockedQuestions: { [key: number]: boolean } = {};


  constructor(private route: ActivatedRoute, private http: HttpClient, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.quizId = Number(params.get('quiz_id'));
    });
    console.log("Quiz Id", this.quizId);
    this.fetchQuizQuestions(this.quizId);
  }

  fetchQuizQuestions(id: number): void {
    this.http.post<any[]>(`${this.baseUrl}/fetch_quiz`, { quiz_id: id })
      .subscribe({
        next: (res: any) => {
          // Extract quiz title from first question
          if (res.length > 0 && res[0].quiz_title) {
            this.quizTitle = res[0].quiz_title;
          }
          
          this.questions = res.map((q: any) => ({
            id: q.id,
            question: q.question_text,
            points: q.points,
            correctOptionId: q.options.find((opt: any) => opt.is_correct_option === 1)?.id, // 👈 store correct ID
            options: q.options.map((opt: any) => ({
              id: opt.id,
              text: opt.option_text
            }))
          }));
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to fetch quiz:', err);
          this.loading = false;
        }
      });
  }

  onOptionSelected(question: any, selectedOptionId: number): void {
    this.selectedAnswers[question.id] = selectedOptionId;

    const isCorrect = selectedOptionId === question.correctOptionId;

    this.snackBar.open(
      isCorrect ? '✅ Right Answer' : '❌ Wrong Answer',
      'Close',
      {
        duration: 2000,
        panelClass: isCorrect ? 'right-snackbar' : 'wrong-snackbar'
      }
    );

    // Lock this question after answer
    this.lockedQuestions[question.id] = true;
  }

  isQuestionLocked(questionId: number): boolean {
    return this.lockedQuestions[questionId] === true;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }

  hasAnsweredAll(): boolean {
    return Object.keys(this.selectedAnswers).length === this.questions.length;
  }

  getAnsweredCount(): number {
    return Object.keys(this.selectedAnswers).length;
  }

  submitAnswers(): void {
    if (!this.hasAnsweredAll()) {
      this.snackBar.open('⚠️ Please answer all questions before submitting', 'Close', { 
        duration: 3000,
        panelClass: 'wrong-snackbar'
      });
      return;
    }

    const payload = {
      user_id: this.userId,
      answers: Object.entries(this.selectedAnswers).map(([questionId, optionId]) => ({
        quiz_id: this.quizId,
        quiz_question_id: Number(questionId),
        question_option_id: optionId
      }))
    };

    this.loading = true;
    this.http.post(`${this.baseUrl}/add_quiz_answer`, payload)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.responses?.length) {
            let correctCount = 0;
            res.responses.forEach((r: any, index: number) => {
              const status = r.is_correct === 1 ? '✅ Right Answer' : '❌ Wrong Answer';
              if (r.is_correct === 1) correctCount++;
              this.snackBar.open(`${status} - Question ${index + 1}`, 'Close', {
                duration: 2000,
                panelClass: r.is_correct === 1 ? 'right-snackbar' : 'wrong-snackbar'
              });
            });

            // Show total points
            setTimeout(() => {
              this.snackBar.open(`🎯 Total Points Earned: ${res.total_points_earned}`, 'Close', {
                duration: 4000,
                panelClass: 'right-snackbar'
              });
            }, 2500);
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed:', err);
          this.snackBar.open('⚠️ Failed to submit answers. Please try again.', 'Close', { 
            duration: 3000,
            panelClass: 'wrong-snackbar'
          });
        }
      });
  }

}
