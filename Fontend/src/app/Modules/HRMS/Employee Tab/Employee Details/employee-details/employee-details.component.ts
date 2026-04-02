



import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { SnackbarService } from '../../../../../Service/snackbar.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AddUpdateAddressDialogComponent } from '../Address/add-update-address-dialog/add-update-address-dialog.component';
import { AddressCardViewComponent } from "../Address/address-card-view/address-card-view.component";
import { NoDataErrorMessageComponent } from '../../../no-data-error-message/no-data-error-message.component';





  @Component({
    selector: 'app-employee-details',
    standalone: true,
    imports: [AngularMaterialModule, AngularMaterialModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule, NoDataErrorMessageComponent, FormsModule],
    providers: [DatePipe],
    templateUrl: './employee-details.component.html',
    styleUrl: './employee-details.component.scss'
  })
  export class EmployeeDetailsComponent  implements OnInit{

  constructor(
    private elementRef: ElementRef,
    public dialog: MatDialog,
    private http: HttpClient,
    // protected dateFormatService: DateFormatService,
    private sanitizer: DomSanitizer,
    private snackbarService: SnackbarService
  ) { }

  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;



  sanitizeHtml(data: string) {
    return this.sanitizer.bypassSecurityTrustHtml(data);
  }

  ngOnInit(): void {
    this.fetchInitialData();
  }

  allInitialDataLoaded: boolean = false;

  async fetchInitialData() {
    // this.ngxService.start();

    // Less Important Data
    this.fetchApplicantKnownLanguages();
    this.fetchApplicantCareerPreferences();
    this.fetchProfileCompleteInfo();

    // Important Data to be fetched under Promise
    const promise1 = new Promise((resolve, reject) => this.fetchApplicantDetails(resolve, reject));
    const promise2 = new Promise((resolve, reject) => this.fetchApplicantAddress(resolve, reject));
    const promise3 = new Promise((resolve, reject) => this.fetchApplicantEducation(resolve, reject));
    const promise4 = new Promise((resolve, reject) => this.fetchApplicantSkills(resolve, reject));
    const promise5 = new Promise((resolve, reject) => this.fetchApplicantWorkExperience(resolve, reject));
    const promise6 = new Promise((resolve, reject) => this.fetchJobSearchStatues(resolve, reject));
    const promise7 = new Promise((resolve, reject) => this.fetchApplicantWorkSamples(resolve, reject));

    try {
      await Promise.all([promise1, promise2, promise3, promise4, promise5, promise6, promise7]);
      this.allInitialDataLoaded = true;
      // this.ngxService.stop();
    } catch (error) {
      console.log(error);
      this.allInitialDataLoaded = false;
      // this.ngxService.stop();
    }
  }

  deleteLoading: boolean = false;

  resumeFile?: File | null;
  hideFileInput: boolean = false;
  loadingState: boolean = false;

  currentJobSearchStatus?: string;
  jobSearchStatues: any;
  languageRatings: any;

  profilePicture: string = '';
  dummyImagePath: string = 'assets/Images/avatar.png';

  profileCompleteInfo = {
    "profile_complete_percentage": 0,
    "show_banner": false
  };
  coverLetterContent: SafeHtml = '';

  applicantDetails: any;
  applicantAddresses: any = [];
  applicantEducation: any = [];
  applicantSkills: any = [];
  applicantWorkExperiences: any = [];
  applicantWorkSamples: any = {
    applicant_id: '',
    no_data: false,
    certification: [],
    patent: [],
    research_publication: [],
    rewards: [],
    work_sample: [],
  };
  applicantKnownLanguages: any = [];
  applicantCareerPreferences: any = [];

  sectionData = [
    { title: 'Work Samples', sectionString: 'work_sample' },
    { title: 'Research Publications', sectionString: 'research_publication' },
    { title: 'Patents', sectionString: 'patent' },
    { title: 'Certifications', sectionString: 'certification' },
    { title: 'Rewards', sectionString: 'rewards' },
  ];

  PersonalInfoLastUpdatedAt: string = '';
  fullName: string = '';
  noAddressMessage: string = 'Please provide your Address.';
  noCoverLetterMessage: string = 'Please provide a cover letter data as it assists recruiters in reviewing your resume effectively.';
  noSkillErrorMessage: string = "Please add your skills to provide recruiters with greater insight into your expertise, helping them understand your specialization more effectively.";
  noEducationErrorMessage: string = "Please add your education information to provide recruiters with more insight into your profile. It will help them understand your qualifications and background better.";
  noWorkExperienceMessage: string = "Please add your previous work experience (if any). It is crucial for evaluating your skills and suitability for the role.";
  noLanguageErrorMessage: string = "Share your language proficiency and known languages to help recruiters understand you better.";
  noCareerPreferenceErrorMessage: string = "Please add your career preferences. It's essential for tailoring better recommendations and suggesting relevant job openings that align with your goals";

  resumeUrl?: string = '';
  resumeLabel: string = 'View Resume';

  quickLinks: any = [
    { title: 'Address', scrollToId: 'address' },
    { title: 'Resume', scrollToId: 'resume' },
    { title: 'Cover letter', scrollToId: 'cover_letter' },
    { title: 'Education', scrollToId: 'education' },
    { title: 'Languages', scrollToId: 'languages' },
    { title: 'Skills', scrollToId: 'skills' },
    { title: 'Work Experience', scrollToId: 'work_experience' },
    { title: 'Attachments', scrollToId: 'attachments' },
    { title: 'Career Preferences', scrollToId: 'career_preference' },
  ];

  async fetchApplicantDetails(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/applicant_details`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          let response = res[0];
          this.fullName=res[0].full_name;
          this.applicantDetails = response;
          this.currentJobSearchStatus = response?.opportunity_status ?? '';
          if (response?.cover_letter) {
            this.coverLetterContent = this.sanitizeHtml(response.cover_letter);
          } else
            this.coverLetterContent = '';

          this.PersonalInfoLastUpdatedAt =response.updated_at
          // this.dateFormatService.formatDate(response.updated_at, 'mediumDate');
          if (response.profile_picture) {
            this.profilePicture = `${this.storageUrl}/${response.profile_picture}`;
            sessionStorage.setItem('profile_picture_path', this.profilePicture);
          } else {
            this.profilePicture = '';
            sessionStorage.setItem('profile_picture_path', this.profilePicture);
          }

          if (response.resume)
            this.resumeUrl = `${this.storageUrl}/${response.resume}`;
          else this.resumeUrl = '';

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

  async fetchApplicantAddress(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/employee_address_details`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          this.applicantAddresses = response;
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

  async fetchApplicantEducation(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/education_information`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.applicantEducation = response;
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

  async fetchApplicantSkills(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_applicant_skills`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.applicantSkills = response;
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

  async fetchApplicantWorkExperience(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_applicant_work_experience`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.applicantWorkExperiences = response;
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

  async fetchApplicantWorkSamples(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_work_sample_attachments`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.applicantWorkSamples = response;
        },
        error: (error) => {
          console.log(error);
          reject && reject(error);
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }

  async fetchApplicantKnownLanguages(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_applicant_language`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.applicantKnownLanguages = response;
        },
        error: (error) => {
          console.log(error);
          reject && reject(error);
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }


  async fetchApplicantCareerPreferences(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/applicant_career_preference`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.applicantCareerPreferences = response;
        },
        error: (error) => {
          console.log(error);
          reject && reject(error);
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }


  async fetchProfileCompleteInfo(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/profile_percentage`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          this.profileCompleteInfo = response;
        },
        error: (error) => {
          console.log(error);
          reject && reject(error);
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }

  // ==============================================================================
  async fetchJobSearchStatues(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_opportunity_status`;

    this.http.get(url)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.jobSearchStatues = response;
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


  onJobSearchStatusRadioChange() {
    this.snackbarService.showLoadingSnackbar();

    const url = `${this.baseUrl}/edit_opportunity_status`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id'),
      opportunity_status: this.currentJobSearchStatus
    };

    this.http.patch(url, requestBody)
      .subscribe({
        next: (response: any) => {

          // console.log(response);
          if (response.success)
            this.snackbarService.showDataSnackbar('Status changed successfully');
          else
            this.snackbarService.showDataSnackbar('An error occurred,please try later');
        },
        error: (error) => {
          console.error(error);
          this.snackbarService.showDataSnackbar('An error occurred,please try later');
        }

      });
  }

  scrollToSection(elementId: string) {
    const element = this.elementRef.nativeElement.querySelector('#' + elementId);
    if (element) {
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 96;
      // 80 is navBar equivalent height in Pixels & we are adding 16 more padding pixels to it, we can't use em/rem here
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }


  handleFileInput(event: any) {
    const file = event.target.files[0]; // Get the selected file
    if (file.size <= 2 * 1024 * 1024) {
      this.resumeFile = file;
      this.hideFileInput = true;
    } else {
      alert('File size exceeds the limit. Please choose a file smaller than 2 MB.');
    }
  }


  deleteFile(): void {
    this.resumeFile = null;
    this.hideFileInput = false;
  }

  formatFileSize(size: number): string {
    if (size === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  uploadResume() {

    this.snackbarService.showLoadingSnackbar();
    this.loadingState = true;

    const formData = new FormData();
    formData.append('applicant_id', sessionStorage.getItem('applicant_id')!.toString());
    formData.append('resume', this.resumeFile!);

    this.http.post(`${this.baseUrl}/upload_resume`, formData)
      .subscribe({
        next: (res: any) => {
          // console.log(res);
          if (res.success) {
            this.fetchApplicantDetails().then(() => {
              this.resumeFile = null;
              this.hideFileInput = false;
              this.snackbarService.showDataSnackbar('Resume Uploaded');
            });
          }
          else {
            this.snackbarService.showDataSnackbar('An error occurred, please try later');
          }
        },
        error: (err: any) => {
          console.log(err);
          this.loadingState = false;
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        },
        complete: () => {
          this.loadingState = false;
        }
      });
  }

  // Update Profile Picture
  openProfilePictureDialog(): void {
    // const dialogRef = this.dialog.open(ChangeProfilePictureDialogComponent, {
    //   // width: '400px', // Adjust the width as per your needs
    //   data: {
    //     onUploadComplete: this.fetchApplicantDetails.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Update Personal Info
  openUpdatePersonalInfoDialog() {
    // const dialogRef = this.dialog.open(UpdatePersonalInfoDialogComponent, {
    //   // width: '50%', // Adjust the width as per your needs
    //   data: {
    //     data: this.applicantDetails,
    //     onUploadComplete: this.fetchApplicantDetails.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

  // Update Cover Letter Data
  openUpdateCoverLetterDialog(): void {
    // const dialogRef = this.dialog.open(UpdateCoverLetterDataDialogComponent, {
    //   // width: '60%', // Adjust the width as per your needs
    //   data: {
    //     data: this.applicantDetails.cover_letter,
    //     onUploadComplete: this.fetchApplicantDetails.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Add new address
  openAddAddressDialog(): void {
    const dialogRef = this.dialog.open(AddUpdateAddressDialogComponent, {
      data: {
        dialogFor: 'Add',
        successMessage: 'Address added successfully',
        onUploadComplete: this.fetchApplicantAddress.bind(this),
      },
    });
    dialogRef.disableClose = true;
  };

  // Update address Dialog
  openUpdateAddressDialog(): void {
    // const dialogRef = this.dialog.open(AddUpdateAddressDialogComponent, {
    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Address updated successfully',
    //     data: this.applicantAddresses,
    //     onUploadComplete: this.fetchApplicantAddress.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Add education Dialog
  openAddEducationDialog(): void {
    // const dialogRef = this.dialog.open(AddUpdateEducationDialogComponent, {
    //   data: {
    //     dialogFor: 'Add',
    //     successMessage: 'Education added successfully',
    //     onUploadComplete: this.fetchApplicantEducation.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Update education Dialog
  openUpdateEducationDialog(object: any): void {

    // const dialogRef = this.dialog.open(AddUpdateEducationDialogComponent, {

    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Education updated successfully',
    //     data: object,
    //     onUploadComplete: this.fetchApplicantEducation.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

  checkGradeType = (number: any) => {
    let num = Number(number);
    if (num <= 10) {
      return num.toString() + ' (CGPA)';
    } else {
      return num.toString() + ' (Percentage)';
    }
  };

  // Add skill Dialog
  openAddSkillDialog(): void {
    // const dialogRef = this.dialog.open(AddUpdateSkillDialogComponent, {
    //   data: {
    //     dialogFor: 'Add',
    //     successMessage: 'Skill added successfully',
    //     onUploadComplete: this.fetchApplicantSkills.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Update skill Dialog
  openUpdateSkillDialog(object: any): void {
    // const dialogRef = this.dialog.open(AddUpdateSkillDialogComponent, {
    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Skill updated successfully',
    //     data: object,
    //     onUploadComplete: this.fetchApplicantSkills.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

  // Add Work Experience Dialog
  openAddWorkExperienceDialog(): void {
    // const dialogRef = this.dialog.open(AddUpdateWorkExperienceDialogComponent, {
    //   data: {
    //     dialogFor: 'Add',
    //     successMessage: 'Work experience added successfully',
    //     onUploadComplete: this.fetchApplicantWorkExperience.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Update Work Experience Dialog
  openUpdateWorkExperienceDialog(object: any): void {
    // const dialogRef = this.dialog.open(AddUpdateWorkExperienceDialogComponent, {
    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Work experience updated successfully',
    //     data: object,
    //     onUploadComplete: this.fetchApplicantWorkExperience.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

  deleteAttachment(id: any): void {
    this.deleteLoading = true;

    const url = `${this.baseUrl}/delete_work_sample_attachments`;

    this.http.post(url, { work_sample_attachment_id: id }).subscribe({
      next: (response: any) => {
        // console.log(response);

        if (response.success) {

          this.fetchApplicantWorkSamples().then(() => {
            this.snackbarService.showDataSnackbar("Attachment deleted");
          });
        } else {
          console.log(response);
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: (error: any) => {
        console.log(error);
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
        this.deleteLoading = false;

      },
      complete: () => {
        this.deleteLoading = false;
      }
    });
  }

  // Add Update Work Sample Dialog
  openAddUpdateWorkSampleDialog(): void {
    // const dialogRef = this.dialog.open(AddWorkSampleDialogComponent, {
    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Work sample updated successfully',
    //     data: this.applicantWorkSamples,
    //     onUploadComplete: this.fetchApplicantWorkSamples.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

  // Add Language Dialog
  openAddLanguageDialog(): void {
    // const dialogRef = this.dialog.open(AddUpdateLanguageDialogComponent, {
    //   data: {
    //     dialogFor: 'Add',
    //     successMessage: 'Language added successfully',
    //     onUploadComplete: this.fetchApplicantKnownLanguages.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Update Language Dialog
  openUpdateLanguageDialog(object: any): void {
    // const dialogRef = this.dialog.open(AddUpdateLanguageDialogComponent, {
    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Language updated successfully',
    //     data: object,
    //     onUploadComplete: this.fetchApplicantKnownLanguages.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

  // Add Language Dialog
  openAddCareerPreferenceDialog(): void {
    // const dialogRef = this.dialog.open(AddUpdateCareerPreferenceDialogComponent, {
    //   data: {
    //     dialogFor: 'Add',
    //     successMessage: 'Career preference added successfully',
    //     onUploadComplete: this.fetchApplicantCareerPreferences.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  // Update Language Dialog
  openUpdateCareerPreferenceDialog(object: any): void {
    // const dialogRef = this.dialog.open(AddUpdateCareerPreferenceDialogComponent, {
    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Career preference updated successfully',
    //     data: object,
    //     onUploadComplete: this.fetchApplicantCareerPreferences.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

}
