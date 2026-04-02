import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-course-quiz',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule
  ],
  templateUrl: './course-quiz.component.html',
  styleUrl: './course-quiz.component.scss',
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class CourseQuizComponent implements OnInit {
  baseUrl = environment.API_URL;
  quizId!: number;
  courseId: string | null = null;
  questions: any[] = [];
  quizTitle: string = 'Course Quiz';
  selectedAnswers: { [key: number]: number } = {};
  loading: boolean = true;
  userId = Number(sessionStorage.getItem('session_id'));
  lockedQuestions: { [key: number]: boolean } = {};
  currentQuestionIndex: number = 0;
  quizSubmitted: boolean = false;
  quizResults: any = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CourseQuizComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.quizId = data.quiz_id;
    this.courseId = data.course_id;
  }

  ngOnInit(): void {
    console.log("Quiz Id", this.quizId);
    this.fetchQuizQuestions(this.quizId);
  }

  fetchQuizQuestions(id: number): void {
    this.loading = true;
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
            correctOptionId: q.options.find((opt: any) => opt.is_correct_option === 1)?.id,
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
          this.snackBar.open('Failed to load quiz questions. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onOptionSelected(question: any, selectedOptionId: number): void {
    this.selectedAnswers[question.id] = selectedOptionId;

    const isCorrect = selectedOptionId === question.correctOptionId;

 
  }

  isQuestionLocked(questionId: number): boolean {
    return this.lockedQuestions[questionId] === true;
  }

  getCurrentQuestion(): any {
    return this.questions[this.currentQuestionIndex];
  }

  nextQuestion(): void {
    const currentQuestion = this.getCurrentQuestion();
    
    // Check if current question is answered
    if (!this.selectedAnswers[currentQuestion.id]) {
      this.snackBar.open('⚠️ Please answer the current question before proceeding', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    // Lock the current question when moving forward
    this.lockedQuestions[currentQuestion.id] = true;

    // Move to next question
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  goToQuestion(index: number): void {
    // Allow navigation to any question
    this.currentQuestionIndex = index;
  }

  onOptionClick(question: any, optionId: number): void {
    if (!this.isQuestionLocked(question.id)) {
      this.selectedAnswers[question.id] = optionId;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  isFirstQuestion(): boolean {
    return this.currentQuestionIndex === 0;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  isCurrentQuestionAnswered(): boolean {
    const currentQuestion = this.getCurrentQuestion();
    return !!this.selectedAnswers[currentQuestion?.id];
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
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
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
            res.responses.forEach((r: any) => {
              if (r.is_correct === 1) correctCount++;
            });

            // Store results
            this.quizResults = {
              totalQuestions: this.questions.length,
              correctAnswers: correctCount,
              wrongAnswers: this.questions.length - correctCount,
              totalPoints: res.total_points_earned,
              percentage: Math.round((correctCount / this.questions.length) * 100),
              responses: res.responses
            };

            // Show results screen with animation
            this.quizSubmitted = true;

            // Show success message
            this.snackBar.open('✅ Quiz submitted successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed:', err);
          this.snackBar.open('⚠️ Failed to submit answers. Please try again.', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
