import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.scss'
})
export class QuestionFormComponent implements OnInit {
  form!: FormGroup;
  allCompetencies: any[] = [];
  allCategories: any[] = [];
  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  isEditMode = false;
  dialogTitle = 'Add Question';

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<QuestionFormComponent>,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    this.isEditMode = !!this.data?.question_id;
    this.dialogTitle = this.isEditMode ? 'Edit Question' : 'Add Question';
    
    this.loadCompetencyLevels();
    this.loadCategories();
    this.buildForm();
  }

  buildForm() {
    if (this.isEditMode) {
      // Edit mode - load existing question
      this.form = this.fb.group({
        question_text: [this.data.question_text, Validators.required],
        points: [this.data.points, Validators.required],
        competency_level_id: [this.data.competency_level_id ?? null, Validators.required],
        category_id: [this.data.category_id ?? null, Validators.required],
        options: this.fb.array([]),
      });

      if (this.data.option && Array.isArray(this.data.option)) {
        this.data.option.forEach((opt: any) => {
          this.options.push(
            this.fb.group({
              option_text: [opt.option_text, Validators.required],
              is_correct_option: [opt.is_correct_option === 1 || opt.is_correct_option === true],
              id: [opt.id],
            })
          );
        });
      }
    } else {
      // Add mode - empty form
      this.form = this.fb.group({
        question_text: ['', Validators.required],
        points: [null, Validators.required],
        competency_level_id: [null, Validators.required],
        category_id: [null, Validators.required],
        correct_option_index: new FormControl<number | null>(null),
        options: this.fb.array([this.createOption(), this.createOption()]),
      });
    }
  }

  get options(): FormArray {
    return this.form.get('options') as FormArray;
  }

  createOption(): FormGroup {
    if (this.isEditMode) {
      return this.fb.group({
        option_text: ['', Validators.required],
        is_correct_option: [false],
        id: [null],
      });
    } else {
      return this.fb.group({
        option_text: ['', Validators.required],
      });
    }
  }

  addOption(): void {
    this.options.push(this.createOption());
  }

  removeOption(index: number): void {
    if (this.options.length > 1) {
      // In add mode, adjust the correct_option_index if needed
      if (!this.isEditMode) {
        const currentCorrectIndex = this.form.get('correct_option_index')?.value;
        if (currentCorrectIndex !== null && currentCorrectIndex !== undefined) {
          if (currentCorrectIndex === index) {
            // Removing the correct option, clear selection
            this.form.get('correct_option_index')?.setValue(null);
          } else if (currentCorrectIndex > index) {
            // Adjust index after removal
            this.form.get('correct_option_index')?.setValue(currentCorrectIndex - 1);
          }
        }
      }
      this.options.removeAt(index);
    }
  }

  getCorrectOptionControl(): FormControl {
    return this.form.get('correct_option_index') as FormControl;
  }

  loadCompetencyLevels() {
    this.http.get(`${this.baseUrl}/competency_dropdown`).subscribe({
      next: (res: any) => (this.allCompetencies = res),
      error: () => console.error('Failed to load competencies')
    });
  }

  loadCategories(): void {
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

  onCorrectOptionChange(selectedIndex: number): void {
    this.options.controls.forEach((ctrl, idx) => {
      if (idx !== selectedIndex) {
        ctrl.get('is_correct_option')?.setValue(false, { emitEvent: false });
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Validate correct option selection
    if (this.isEditMode) {
      const hasCorrectOption = this.options.controls.some(ctrl => 
        ctrl.get('is_correct_option')?.value === true
      );
      if (!hasCorrectOption) {
        this.snackBar.open('Please select at least one correct option.', 'Close', {
          duration: 3000,
        });
        return;
      }
      this.updateQuestion();
    } else {
      const correctOptionIndex = this.form.get('correct_option_index')?.value;
      if (correctOptionIndex === null || correctOptionIndex === undefined) {
        this.snackBar.open('Please select a correct option.', 'Close', {
          duration: 3000,
        });
        return;
      }
      this.addQuestion();
    }
  }

  addQuestion(): void {
    const formData = new FormData();
    const formValue = this.form.value;

    formData.append('question_text', formValue.question_text);
    formData.append('points', formValue.points.toString());
    formData.append('is_active', 'true');
    formData.append('user_id', this.userId.toString());
    formData.append('competency_level_id', formValue.competency_level_id?.toString() ?? '-1');
    formData.append('category_id', formValue.category_id?.toString());

    const optionDetails = formValue.options.map((opt: any, idx: number) => ({
      text: opt.option_text,
      is_correct_option: idx === formValue.correct_option_index,
    }));

    optionDetails.forEach((opt: any, idx: number) => {
      formData.append(`optionDetails[${idx}]`, JSON.stringify(opt));
    });

    this.http.post(`${this.baseUrl}/add_quiz_question`, formData).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: res.message || 'Question added successfully' },
          });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(`Failed to add question: ${res?.message}`, 'Close', {
            duration: 3000,
          });
        }
      },
      error: () => {
        this.snackBar.open('Failed to add question', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  updateQuestion(): void {
    const payload = {
      question_id: this.data.question_id,
      question_text: this.form.value.question_text,
      is_active: true,
      points: this.form.value.points,
      competency_level_id: this.form.value.competency_level_id ?? -1,
      category_id: this.form.value.category_id,
      updated_by: this.userId,
      optionDetails: this.form.value.options.map((opt: any) => ({
        id: opt.id,
        text: opt.option_text,
        is_correct_option: opt.is_correct_option,
      })),
    };

    this.http.post(`${this.baseUrl}/edit_quiz_question`, payload).subscribe({
      next: (res: any) => {
        this.dialog.open(SuccessDialogComponent, {
          data: { message: res.message || 'Question updated successfully!' },
        });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Unable to process the request.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

