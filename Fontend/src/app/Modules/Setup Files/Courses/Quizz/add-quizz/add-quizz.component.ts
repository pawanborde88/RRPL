import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { RouterModule } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddChannelPartnerComponent } from '../../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-add-quizz',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    QuillModule,
  ],
  templateUrl: './add-quizz.component.html',
  styleUrl: './add-quizz.component.scss'
})
export class AddQuizzComponent implements OnInit{
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  allCompentenceLevel: any[] = [];
  userId = Number(sessionStorage.getItem('session_id'));
  isTypingInvalidMaxAttempt = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddQuizzComponent> // Reference to the dialog
  ) { }

  addQuizForm = new FormGroup({
    user_id: new FormControl(this.userId),
    title: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    bonus_points: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    competency_level_id: new FormControl('', Validators.required),
    no_of_days: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    max_attempt: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    active_status_id: new FormControl('', Validators.required),
    valid_from: new FormControl<Date | null>(null, Validators.required),
    valid_till: new FormControl<Date | null>(null, Validators.required),

  });



  ngOnInit(): void {
    // console.log(this.data);
    this.fetchCompetencyLevels();

    if (this.data?.rowData) {
      this.patchQuizFormData(this.data.rowData);
    }

    this.addQuizForm.setValidators(this.dateRangeValidator);

  }

  dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const from = group.get('valid_from')?.value;
    const to = group.get('valid_till')?.value;

    if (!from || !to) {
      return { dateRangeRequired: true };
    }

    return null;
  };

  fetchCompetencyLevels(): void {
    this.http.get<any[]>(`${this.baseUrl}/fetch_competency_level`)
      .subscribe({
        next: (data) => this.allCompentenceLevel = data,
        error: () => this.snackBar.open('Unable to load competencies', 'Close', { duration: 3000 })
      });
  }

  patchQuizFormData(data: any): void {

    const validFrom = data.valid_from ? new Date(data.valid_from) : null;
    const validTill = data.valid_to ? new Date(data.valid_to) : null;

    this.addQuizForm.patchValue({
      user_id: this.userId,
      title: data.title || '',
      description: data.description || '',
      bonus_points: data.bonus_points || '',
      competency_level_id: data.competency_level_id || null,
      no_of_days: data.no_of_days || '',
      max_attempt: data.max_attempt || '',
      active_status_id: data.active_status_id || 1,
      // valid_from: data.valid_from || '',
      // valid_till: data.valid_till || '',
      valid_from: validFrom,
      valid_till: validTill
    });
  }


  onSubmit(): void {
    if (this.addQuizForm.invalid) {
      this.addQuizForm.markAllAsTouched();
      return;
    }

    const val = this.addQuizForm.value;
    const payload: any = {
      title: val.title,
      description: val.description,
      is_active: val.active_status_id,
      valid_date_range: [
        this.formatDate(val.valid_from),
        this.formatDate(val.valid_till)
      ],
      valid_from: this.formatDate(val.valid_from, true),
      valid_to: this.formatDate(val.valid_till, true),
      competency_level_id: val.competency_level_id,
      bonus_points: +(val.bonus_points ?? 0),
      no_of_days: +(val.no_of_days ?? 0),
      time: "00:00:00", // or use input
      max_attempt: +(val.max_attempt ?? 0),
      user_id: this.userId,
      created_by: this.userId,
      updated_by: this.userId,
      updated_at: new Date().toISOString(),
    
    };


    // const quizId = this.data?.rowData?.id ;
    // if (this.data.apiUrl === 'edit_quiz' && quizId) {
    //   payload.quiz_id = quizId;
    // }

    if (this.data?.rowData?.id) {
      payload['quiz_id'] = this.data.rowData.id;
    }

    console.log('Payload before sending:', payload);

    const apiUrl = `${this.baseUrl}/${this.data.apiUrl}`;

    this.http.post(apiUrl, payload).subscribe({
      next: (res: any) => {
        this.snackBar.open(this.data.successMessage, 'Close', {
          duration: 3000,
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

  private formatDate(date: any, withTime: boolean = false): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const time = '00:00:00.000';
    return withTime ? `${yyyy}-${mm}-${dd} ${time}` : `${yyyy}-${mm}-${dd}T00:00:00.000`;
  }



}
