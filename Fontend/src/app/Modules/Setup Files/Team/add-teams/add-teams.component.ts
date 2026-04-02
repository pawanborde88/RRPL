import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-add-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,

  ],
  templateUrl: './add-teams.component.html',
  styleUrls: ['./add-teams.component.scss'], // Fixed typo: `styleUrl` → `styleUrls`
})
export class AddTeamsComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  allTeamList: any[] = []; // Holds team list data fetched from API

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddTeamsComponent> // Reference to the dialog
  ) {}

  addTeamForm = new FormGroup({
    team_name: new FormControl('', Validators.required),
    manager_id: new FormControl('', Validators.required), // Initialized as an array
    team_member_id: new FormControl('', Validators.required), // Initialized as an array
  });

  ngOnInit(): void {
    this.fetchTeamDetails();
    if (this.data?.team_id) {
      this.fetchSingleTeam();
    }
  }
  fetchTeamDetails(): void {
    this.http.get(`${this.baseUrl}/user_dropdown`).subscribe({
      next: (res: any) => {
        this.allTeamList = res; // Assign API response to `allTeamList`
      },
      error: (err) => {
        console.error('Error fetching team details:', err);
        this.snackBar.open('Error fetching team details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  fetchSingleTeam(): void {
    this.http
      .post(`${this.baseUrl}/fetch_single_team`, { team_id: this.data?.team_id || null })
      .subscribe({
        next: (res: any) => {
          if (res) {
            // Patch the API response to the form controls
            this.addTeamForm.patchValue({
              team_name: res.team_name,
              manager_id: res.manager_id, // Array value
              team_member_id: res.team_member_id, // Array value
            });
          } else {
            this.snackBar.open('Invalid data received from server.', 'Close', {
              duration: 3000,
            });
          }
        },
        error: (err: any) => {
          console.error('Error fetching team details:', err);
          this.snackBar.open('Unable to fetch team details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  onSubmit(): void {
    // Check if form is valid
    if (this.addTeamForm.invalid) {
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Prepare form data
    const formData = this.addTeamForm.value;
    const payload = {
      team_name: formData.team_name,
      manager_id: formData.manager_id?.toString(),
      team_member_id: formData.team_member_id?.toString(), // Convert to comma-separated string
    };

    // Determine the appropriate API endpoint and payload based on the operation
    if (this.data?.team_id) {
      // Edit team logic
      const editPayload = { team_id: this.data.team_id, ...payload };
      this.http.post(`${this.baseUrl}/edit_team`, editPayload).subscribe({
        next: () => {
          this.snackBar.open('Team updated successfully.', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(true); // Close dialog with success
        },
        error: (err) => {
          console.error('Error updating team:', err);
          this.snackBar.open('Error updating team.', 'Close', {
            duration: 3000,
          });
        },
      });
    } else {
      // Add team logic
      this.http.post(`${this.baseUrl}/add_team`, payload).subscribe({
        next: () => {
          this.snackBar.open('Team added successfully.', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(true); // Close dialog with success
        },
        error: (err) => {
          console.error('Error adding team:', err);
          this.snackBar.open('Error adding team.', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }
}
