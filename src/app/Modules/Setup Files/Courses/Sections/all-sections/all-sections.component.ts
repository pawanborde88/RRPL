import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAccordion } from '@angular/material/expansion';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { environment } from '../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddSectionsComponent } from '../add-sections/add-sections.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { PreviewLectureComponent } from '../../preview-lecture/preview-lecture.component';
import { AddLecturesComponent } from '../../lectures/add-lectures/add-lectures.component';
import { CourseQuizComponent } from '../../course-quiz/course-quiz.component';

@Component({
  selector: 'app-all-sections',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
  ],
  templateUrl: './all-sections.component.html',
  styleUrl: './all-sections.component.scss',
})
export class AllSectionsComponent implements OnInit, OnDestroy {
  // Environment & Configuration
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  // Component State
  loading = false;
  sectionData: any[] = [];
  courseName = '';
  allLectures: any[] = [];
  rowData: any;
  courseId: string | null = null;
  
  // Search and Filter
  searchQuery = '';
  filteredSections: any[] = [];

  // User Session Data
  private readonly roleId = Number(sessionStorage.getItem('role_id'));
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  private readonly permissionData = sessionStorage.getItem('permission');

  // Cleanup
  private destroy$ = new Subject<void>();

  @ViewChild(MatAccordion) accordion!: MatAccordion;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private fetch: FetchFunctionsService,
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component with course data
   */
  private initializeComponent(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.courseId = params['course_id'];
        if (this.courseId) {
          this.fetchSingleCourse();
          this.fetchAllSections();
        }
      });
  }

  /**
   * Fetch single course data using Promise
   */
  async fetchSingleCourse(): Promise<void> {
    if (!this.courseId) {
      this.showError('Course ID is missing');
      return;
    }

    try {
      const payload = {
        course_id: this.courseId,
        user_id: this.userId,
      };

      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/fetch_single_course`, payload)
      );

      if (response) {
        this.rowData = response;
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      this.showError('Unable to fetch course details. Please try again later.');
    }
  }

  /**
   * Fetch all sections for the current course using Promise
   */
  async fetchAllSections(): Promise<void> {
    if (!this.courseId) {
      this.showError('Course ID is missing');
      return;
    }

    this.loading = true;
    
    try {
      const payload = {
        course_id: this.courseId,
        logged_user_id: this.userId,
      };

      const response: any = await firstValueFrom(
        this.http.post(`${this.baseUrl}/fetch_sections`, payload)
      );

      this.sectionData = this.processSectionsData(response);
      this.courseName = response.course_name || '';
      
      // Automatically fetch lectures for all sections
      await this.fetchAllLectures();
    } catch (err) {
      console.error('Error fetching sections:', err);
      this.showError('Unable to fetch sections. Please try again later.');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Fetch lectures for all sections
   */
  private async fetchAllLectures(): Promise<void> {
    const fetchPromises = this.sectionData.map(section => 
      this.fetchLecturesForSection(section)
    );
    await Promise.all(fetchPromises);
  }

  /**
   * Process sections data to add required properties
   */
  private processSectionsData(sections: any[]): any[] {
    return sections.map((section: any) => ({
      ...section,
      lectures: [],
      isLecturesLoading: false,
      last_section_completion_status: section.last_section_completion_status ?? true,
    }));
  }

  /**
   * Delete a lecture with confirmation
   */
  deleteLecture(lectureId: number, section: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '300px',
      maxWidth: '500px',
      data: { 
        message: 'Are you sure you want to delete this lecture? This action cannot be undone.' 
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performLectureDeletion(lectureId, section);
        }
      });
  }

  /**
   * Perform the actual lecture deletion using Promise
   */
  private async performLectureDeletion(lectureId: number, section: any): Promise<void> {
    try {
      const payload = { lecture_id: lectureId };

      await firstValueFrom(
        this.http.post(`${this.baseUrl}/delete_lecture`, payload)
      );

      this.showSuccess('Lecture deleted successfully');
      await this.fetchLecturesForSection(section);
    } catch (err) {
      console.error('Error deleting lecture:', err);
      this.showError('Unable to delete lecture. Please try again.');
    }
  }

  /**
   * Fetch lectures for a specific section using Promise
   */
  async fetchLecturesForSection(section: any): Promise<void> {
    if (!section.section_id) {
      console.error('Section ID is missing');
      return;
    }

    section.isLecturesLoading = true;

    try {
      const payload = {
        section_id: section.section_id,
        logged_user_id: this.userId,
      };

      const response: any = await firstValueFrom(
        this.http.post(`${this.baseUrl}/fetch_lectures`, payload)
      );

      this.allLectures = response;
      section.lectures = this.processLecturesData(response);
    } catch (err) {
      console.error('Error fetching lectures:', err);
      this.showError('Unable to fetch lectures. Please try again.');
    } finally {
      section.isLecturesLoading = false;
    }
  }

  /**
   * Process lectures data to clean URLs
   */
  private processLecturesData(lectures: any[]): any[] {
    return lectures.map((lecture: any) => {
      const cleanedUrl = this.cleanVideoUrl(lecture.content_url);
      return {
        ...lecture,
        content_url: cleanedUrl,
        lecture_video: cleanedUrl,
      };
    });
  }

  /**
   * Clean video URL by removing escaped characters
   */
  private cleanVideoUrl(url: string): string {
    if (!url) return url;
    return url
      .replace(/\\\//g, '/')
      .replace(/\\\\/g, '\\');
  }


  /**
   * Open lecture preview dialog
   */
  previewLecture(lecture: any, section: any): void {
    const videoUrl = lecture.lecture_video || lecture.content_url;

    if (!videoUrl) {
      this.showError('No video available for this lecture.');
      return;
    }

    // Enroll user in the lecture
    this.enrollLecture(lecture);

    // Determine if this is the last section
    const currentSectionIndex = this.sectionData.findIndex(s => s.section_id === section.section_id);
    const isLastSection = currentSectionIndex === this.sectionData.length - 1;

    const dialogRef = this.dialog.open(PreviewLectureComponent, {
      width: '90vw',
      maxWidth: '1000px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      data: {
        lecture,
        section_id: section.section_id,
        videoUrl,
        course_id: this.courseId,
        is_last_section: isLastSection,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (result) => {
        if (result) {
          // Only fetch lectures for the specific section to update completion status
          await this.fetchLecturesForSection(section);
          // Also refresh course data to update overall completion status
          await this.fetchSingleCourse();
        }
      });
  }

  /**
   * Open dialog to add or edit sections
   */
  openAddEditSections(action: 'add' | 'edit', row?: any): void {
    const isAdd = action === 'add';
    
    const dialogRef = this.dialog.open(AddSectionsComponent, {
      width: '90vw',
      maxWidth: '600px',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        title: isAdd ? 'Add New Section' : 'Edit Section',
        apiUrl: isAdd ? 'add_section' : 'edit_section',
        successMessage: isAdd 
          ? 'Section added successfully' 
          : 'Section updated successfully',
        rowData: row,
        courseID: this.courseId,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.fetchAllSections();
        }
      });
  }

  /**
   * Delete a section with confirmation
   */
  deleteSections(sectionId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '300px',
      maxWidth: '500px',
      data: { 
        message: 'Are you sure you want to delete this section? All lectures in this section will also be deleted. This action cannot be undone.' 
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performSectionDeletion(sectionId);
        }
      });
  }

  /**
   * Perform the actual section deletion using Promise
   */
  private async performSectionDeletion(sectionId: number): Promise<void> {
    try {
      const payload = { section_id: sectionId };

      await firstValueFrom(
        this.http.post(`${this.baseUrl}/delete_section`, payload)
      );

      this.showSuccess('Section deleted successfully');
      await this.fetchAllSections();
    } catch (err) {
      console.error('Error deleting section:', err);
      this.showError('Unable to delete section. Please try again.');
    }
  }

  /**
   * Enroll user in lecture via API
   */
  private async enrollLecture(lecture: any): Promise<void> {
    if (!lecture?.lecture_id || !this.userId) {
      console.error('Missing required data for lecture enrollment');
      return;
    }

    try {
      const payload = {
        lecture_id: lecture.lecture_id,
        user_id: this.userId,
        start_date: new Date().toISOString().split('T')[0],
      };

      await firstValueFrom(
        this.http.post(`${this.baseUrl}/enroll_lecture`, payload)
      );

      console.log('User enrolled in lecture successfully');
    } catch (err) {
      console.error('Error enrolling in lecture:', err);
      // Don't show error to user as this is a background operation
    }
  }

  /**
   * Enroll user in section
   */
  async enrollSection(section: any): Promise<void> {
    if (!section?.section_id || !this.userId) {
      this.showError('Unable to enroll. Missing required information.');
      return;
    }

    try {
      const payload = {
        section_id: section.section_id,
        user_id: this.userId,
        start_date: new Date().toISOString().split('T')[0],
      };

      await firstValueFrom(
        this.http.post(`${this.baseUrl}/enroll_section`, payload)
      );

      this.showSuccess('Enrolled successfully! You can now access this section.');
      
      // Refresh the sections to update the lock status
      await this.fetchAllSections();
    } catch (err) {
      console.error('Error enrolling in section:', err);
      this.showError('Unable to enroll in section. Please try again.');
    }
  }

  /**
   * Open dialog to add or edit lectures
   */
  openLecturesDialog(action: 'add' | 'edit', element: any, sectionId: number): void {
    const isAdd = action === 'add';
    
    const dialogRef = this.dialog.open(AddLecturesComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        title: isAdd ? 'Add New Lecture' : 'Edit Lecture',
        apiUrl: isAdd ? 'add_lectures' : 'edit_lecture',
        successMessage: isAdd 
          ? 'Lecture added successfully' 
          : 'Lecture updated successfully',
        rowData: {
          ...element,
          section_id: sectionId,
        },
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.fetchAllSections();
        }
      });
  }

  /**
   * Open course quiz dialog
   */
  openCourseQuizDialog(quizId: number): void {
    if (!quizId) {
      this.showError('No quiz available for this course.');
      return;
    }

    const dialogRef = this.dialog.open(CourseQuizComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        quiz_id: quizId,
        course_id: this.courseId,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          // Refresh course data after quiz completion
          this.fetchSingleCourse();
          this.fetchAllSections();
        }
      });
  }

  /**
   * Open lecture quiz dialog
   */
  openLectureQuizDialog(quizId: number): void {
    if (!quizId) {
      this.showError('No quiz available for this lecture.');
      return;
    }

    const dialogRef = this.dialog.open(CourseQuizComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        quiz_id: quizId,
        course_id: this.courseId,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          // Refresh sections and course data after quiz completion
          this.fetchSingleCourse();
          this.fetchAllSections();
        }
      });
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.permissionData?.includes(permission) ?? false;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Get total duration of all sections in hours
   */
 
 

  /**
   * Search functionality - filter sections and lectures based on search query
   */
  onSearchChange(): void {
    this.filteredSections = this.getFilteredSections();
    
    // Auto-expand sections that have matching lectures when searching
    if (this.searchQuery) {
      this.filteredSections.forEach(section => {
        section.expanded = true;
      });
    }
  }

  /**
   * Get filtered sections based on search query
   */
  getFilteredSections(): any[] {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return this.sectionData;
    }

    const query = this.searchQuery.toLowerCase().trim();
    
    return this.sectionData.filter(section => {
      // Check if section title matches
      const sectionMatches = section.title?.toLowerCase().includes(query);
      
      // Check if any lecture in this section matches
      const hasMatchingLecture = section.lectures?.some((lecture: any) =>
        lecture.title?.toLowerCase().includes(query)
      );
      
      return sectionMatches || hasMatchingLecture;
    });
  }

  /**
   * Get filtered lectures for a specific section
   */
  getFilteredLecturesForSection(section: any): any[] {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return section.lectures || [];
    }

    const query = this.searchQuery.toLowerCase().trim();
    
    return (section.lectures || []).filter((lecture: any) =>
      lecture.title?.toLowerCase().includes(query)
    );
  }

  /**
   * Get count of filtered sections
   */
  getFilteredSectionsCount(): number {
    return this.getFilteredSections().length;
  }

  /**
   * Get count of filtered lectures across all sections
   */
  getFilteredLecturesCount(): number {
    return this.getFilteredSections().reduce((total, section) => {
      return total + this.getFilteredLecturesForSection(section).length;
    }, 0);
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }

 

  /**
   * Calculate course completion percentage
   */
  getCourseCompletionPercentage(): number {
    const totalLectures = this.rowData?.lecture_count || 0;
    if (totalLectures === 0) return 0;

    let completedLectures = 0;
    this.sectionData.forEach(section => {
      section.lectures?.forEach((lecture: any) => {
        if (lecture.is_completed || lecture.completion_status === true) {
          completedLectures++;
        }
      });
    });

    return Math.round((completedLectures / totalLectures) * 100);
  }
}
