import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-project-settings',
  standalone: true,
   imports: [
     CommonModule,
     RouterModule,
     AngularMaterialModule,
     FormsModule,
     ReactiveFormsModule,
   ],
  templateUrl: './project-settings.component.html',
  styleUrl: './project-settings.component.scss'
})
export class ProjectSettingsComponent implements OnInit{
baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  
  allProjectLists:any[]=[]
  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
   
  ) {}

  ngOnInit(): void {
    this.fetchAllProjectFields();
  }
  private initializeCategoryFields(): void {
    this.allProjectLists.forEach(category => {
      category.fields.forEach((field: any) => {
        if (field.field_type_id === 1) {
          // For checkbox or dropdown options
          field.options.forEach((option: any) => {
            option.checked = false;  // Reset each option to unchecked by default
          });
        } else if (field.field_type_id === 2) {
          // For text input
          field.inputValue = '';  // Initialize the input field as an empty string
          field.field_text = [];  // Initialize the field_text array for text inputs
        } else if (field.field_type_id === 3) {
          // For dropdown selection
          field.selectedOption = null;  // Set the selected option to null
        }
      });
    });
  }
  

    fetchAllProjectFields(): void {
      this.http.get<any>(`${this.baseUrl}/fetch_project_fields`).subscribe({
        next: (res) => {
          this.allProjectLists = res;
        
        },
        error: () => {
          this.snackBar.open('Unable to fetch project fields.', 'Close', {
            duration: 3000,
          });
        },
      });
    }
}
