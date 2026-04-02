import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { MatTableDataSource } from '@angular/material/table';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-facebook-question',
  standalone: true,
  imports: [   CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    ReusableTableComponent,

  ],
  templateUrl: './facebook-question.component.html',
  styleUrl: './facebook-question.component.scss'
})
export class FacebookQuestionComponent implements OnInit {
  baseUrl = environment.API_URL;
  facebookQuestion: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<FacebookQuestionComponent> // Reference to the dialog
  ) {}
  displayedColumns = [

    {
      key: 'sr_no',
      label: '',
      type: 'index',
    },
    { key: 'question', label: 'Question' },
    { key: 'answer', label: 'Answer' },
   
  
  ];
  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllFacebookQuestion();
  }
  fetchAllFacebookQuestion(): void {
    this.loading = true;
    this.http.post<any>(`${this.baseUrl}/fetch_facebook_question`, {project_lead_id:this.data.rowData}).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.facebookQuestion = res.data;
          this.dataSource = new MatTableDataSource(res.data.question_ans);


        }
      },
      error: (err) => {
        this.snackBar.open('Error fetching facebook question', 'Close', {
          duration: 3000,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
