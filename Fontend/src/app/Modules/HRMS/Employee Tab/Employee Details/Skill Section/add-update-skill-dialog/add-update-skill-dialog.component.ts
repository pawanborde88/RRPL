import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';


@Component({
  selector: 'app-add-update-skill-dialog',
  standalone: true,
imports: [AngularMaterialModule, CommonModule, ReactiveFormsModule, FormsModule,],
  templateUrl: './add-update-skill-dialog.component.html',
  styleUrls: ['./add-update-skill-dialog.component.scss']
})
export class AddUpdateSkillDialogComponent implements OnInit {

  myControl = new FormControl();
  filteredOptions?: Observable<any>;

      baseUrl = environment.API_URL;
      storageUrl = environment.STORAGE_URL;

  constructor(
    private dialogRef: MatDialogRef<AddUpdateSkillDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) { }

  displayFn(skill: any): string {
    return skill && skill.skill_name ? skill.skill_name : '';

  }

  filterOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.Skills.filter((option: any) => option.skill_name.toLowerCase().includes(filterValue));
  }

  optionSelected(event: any) {
    console.log('Selected option:', event.option.value.skill_id);
    this.skillForm.patchValue({ skill: event.option.value.skill_id });
  }


  loading: boolean = false;

  dialogFor: string = this.data.dialogFor;
  successMessage: string = this.data.successMessage;
  updateData: any = this.data?.data ? this.data.data : null;

  Skills: any = [];
  Ratings: any = [];

  ngOnInit(): void {
    this.fetchInitialData();
  };

  async fetchInitialData() {
    this.skillForm.disable();
    this.myControl.disable();
    this.loading = true;
    const promise1 = new Promise((resolve, reject) => this.fetchSkills(resolve, reject));
    const promise2 = new Promise((resolve, reject) => this.fetchRatings(resolve, reject));
    try {
      await Promise.all([promise1, promise2]);
      this.skillForm.enable();
      this.myControl.enable();

      this.loading = false;
    } catch (error) {
      console.log(error);
      this.skillForm.enable();
      this.myControl.enable();
    }
  }
  skillForm = new FormGroup(
    this.dialogFor === 'Add' ?
      {
        applicant_id: new FormControl(sessionStorage.getItem('applicant_id')),
        skill: new FormControl('', Validators.required),
        self_rating: new FormControl('', Validators.required),
        total_experience: new FormControl('', Validators.pattern('^[0-9]+$')),
        last_work_on: new FormControl('', Validators.pattern(/^(0?[1-9]|1[0-2])-\d{4}$/)),
        comment: new FormControl(''),
      }
      :
      {
        applicant_id: new FormControl(sessionStorage.getItem('applicant_id')),
        applicant_skill_id: new FormControl(this.updateData?.applicant_skill_id),
        skill: new FormControl(this.updateData?.skill, Validators.required),
        self_rating: new FormControl(this.updateData?.self_rating, Validators.required),
        total_experience: new FormControl(this.updateData?.total_experience, Validators.pattern('^[0-9]+$')),
        last_work_on: new FormControl(this.updateData?.last_work_on, Validators.pattern(/^(0?[1-9]|1[0-2])-\d{4}$/)),
        comment: new FormControl(this.updateData?.comment),
      }
  );



  async fetchSkills(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_skills`;
    this.http.get(url)
      .subscribe({
        next: (response: any) => {
          this.Skills = response;

          this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(''),
            map(value => {
              const name = typeof value === 'string' ? value : value?.skill_name;
              return name ? this.filterOptions(name as string) : this.Skills.slice();
            }),
          );
          if (this.dialogFor === 'Update') {
            const selectedSkill = this.Skills.find((skill: any) => skill.skill_id === this.data.data.skill);
            // Set the value of the autocomplete field
            this.myControl.setValue(selectedSkill);
          }
        },

        error: (error) => {
          console.error(error);
          reject && reject();
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }


  async fetchRatings(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_rating`;
    this.http.get(url)
      .subscribe({
        next: (response: any) => {
          this.Ratings = response;
        },
        error: (error) => {
          console.error(error);
          reject && reject();
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }


  saveSkill(): void {
    this.loading = true;

    const url = `${this.baseUrl}/${this.dialogFor === 'Add' ? 'add_applicant_skill' : 'update_applicant_skill'}`;
    const body = this.skillForm.value;
    console.log(body);
    this.http.post(url, body,).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar(this.successMessage);
          });
        } else {
          console.log(response);
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: (error: any) => {
        console.log(error);
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
        this.loading = false;

      },
      complete: () => {
        this.loading = false;
        this.dialogRef.close();
      }
    });
  };

  deleteSkill(): void {
    this.loading = true;

    const url = `${this.baseUrl}/delete_applicant_skill`;

    this.http.post(url, { applicant_skill_id: this.updateData?.applicant_skill_id }).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar("Skill deleted");
          });
        } else {
          console.log(response);
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: (error: any) => {
        console.log(error);
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
        this.loading = false;

      },
      complete: () => {
        this.loading = false;
        this.dialogRef.close();
      }
    });
  }

}
