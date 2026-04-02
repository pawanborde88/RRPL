import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';

import { QuillModule } from 'ngx-quill';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-preview-lecture',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule,
  ],
  templateUrl: './preview-lecture.component.html',
  styleUrl: './preview-lecture.component.scss'
})
export class PreviewLectureComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;
  
  // Environment & Configuration
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  // Component State
  videoUrl: SafeResourceUrl | null = null;
  selectedLecture: any;
  isPlaying = false;
  completionApiCalled = false;
  allLectures: any[] = [];
  isLoadingLectures = false;
  courseId: number | null = null;
  isLastSection = false;

  // User Session
  private readonly userId = Number(sessionStorage.getItem('session_id'));

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<PreviewLectureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { 
    // Configure dialog
    this.dialogRef.updateSize('90vw', '85vh');
    this.dialogRef.addPanelClass('preview-lecture-dialog');
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupScreenshotProtection();
  }

  ngOnDestroy(): void {
    // Pause video before destroying
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component data
   */
  private initializeComponent(): void {
    // Set course and section information
    this.courseId = this.data?.course_id ? Number(this.data.course_id) : null;
    this.isLastSection = this.data?.is_last_section ?? false;

    // Set selected lecture
    if (this.data?.lecture) {
      this.selectedLecture = this.processLectureData(this.data.lecture);
      this.setVideoUrl(this.selectedLecture);
      
      // Enroll user in the lecture
      this.enrollLecture(this.selectedLecture);
    }

    // Fetch lectures for the section
    if (this.data?.section_id) {
      this.fetchLecturesForSection(this.data.section_id);
    }
  }

  /**
   * Process lecture data to clean URLs
   */
  private processLectureData(lecture: any): any {
    const cleanedUrl = this.cleanUrl(lecture.content_url);
    return {
      ...lecture,
      content_url: cleanedUrl || lecture.content_url,
      lecture_video: cleanedUrl || lecture.content_url
    };
  }

  /**
   * Clean URL by removing escaped characters
   */
  private cleanUrl(url: string): string {
    if (!url) return url;
    return url
      .replace(/\\\//g, '/')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Update selected lecture and switch video
   */
  updateLecture(lecture: any): void {
    // Pause current video
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
    }

    this.selectedLecture = lecture;
    this.videoUrl = null;
    this.completionApiCalled = false;
    this.isPlaying = false;
    
    // Enroll user in the new lecture
    this.enrollLecture(lecture);
    
    setTimeout(() => {
      this.setVideoUrl(lecture);
      
      // Load new video
      setTimeout(() => {
        if (this.videoPlayer?.nativeElement) {
          this.videoPlayer.nativeElement.load();
        }
      }, 100);
    }, 50);
  }

  /**
   * Set video URL for player
   */
  setVideoUrl(lecture: any): void {
    const videoPath = lecture.lecture_video || lecture.content_url;
    if (videoPath) {
      const fullUrl = this.buildFullUrl(videoPath);
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    } else {
      console.warn('No valid video path found for lecture:', lecture.title);
      this.showError('No video available for this lecture');
    }
  }

  /**
   * Get safe video URL for lecture thumbnail
   */
  getSafeVideoUrl(lecture: any): SafeResourceUrl | null {
    const url = lecture.lecture_video || lecture.content_url;
    if (!url) return null;
    const fullUrl = this.buildFullUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }

  /**
   * Build full URL from path
   */
  private buildFullUrl(path: string): string {
    return path.startsWith('http') ? path : `${this.storageUrl}/${path}`;
  }

  /**
   * Handle video play event
   */
  onVideoPlay(): void {
    this.isPlaying = true;
  }

  /**
   * Handle video pause event
   */
  onVideoPause(): void {
    this.isPlaying = false;
  }

  /**
   * Prevent default touch events to disable scrolling and double-tap
   */
  onTouchEvent(event: TouchEvent): void {
    event.preventDefault();
  }

  /**
   * Prevent default mouse events (like context menu)
   */
  onMouseEvent(event: MouseEvent): void {
    event.preventDefault();
  }

  /**
   * Setup screenshot protection measures
   */
  private setupScreenshotProtection(): void {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      if (this.isVideoArea(e.target as HTMLElement)) {
        e.preventDefault();
        return false;
      }
      return true;
    });

    // Disable keyboard shortcuts for screenshots
    document.addEventListener('keydown', (e) => {
      // Disable Print Screen, Alt+Print Screen, Ctrl+Shift+S, etc.
      if (e.key === 'PrintScreen' || 
          (e.altKey && e.key === 'PrintScreen') ||
          (e.ctrlKey && e.shiftKey && e.key === 'S') ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'U')) {
        if (this.isVideoArea(e.target as HTMLElement)) {
          e.preventDefault();
          e.stopPropagation();
          this.showScreenshotWarning();
          return false;
        }
      }
      return true;
    });

    // Disable F12 and other dev tools shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        if (this.isVideoArea(e.target as HTMLElement)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      return true;
    });

    // Disable drag and drop
    document.addEventListener('dragstart', (e) => {
      if (this.isVideoArea(e.target as HTMLElement)) {
        e.preventDefault();
        return false;
      }
      return true;
    });

    // Disable text selection
    document.addEventListener('selectstart', (e) => {
      if (this.isVideoArea(e.target as HTMLElement)) {
        e.preventDefault();
        return false;
      }
      return true;
    });

    // Disable copy operations
    document.addEventListener('copy', (e) => {
      if (this.isVideoArea(e.target as HTMLElement)) {
        e.preventDefault();
        return false;
      }
      return true;
    });
  }

  /**
   * Check if the target element is within the video area
   */
  private isVideoArea(element: HTMLElement): boolean {
    if (!element) return false;
    
    const videoPlayer = this.videoPlayer?.nativeElement;
    const videoContainer = element.closest('.video-player-wrapper');
    
    return element === videoPlayer || 
           (videoContainer !== null) ||
           element.classList.contains('video-player') ||
           element.classList.contains('video-player-wrapper') ||
           element.classList.contains('video-container');
  }

  /**
   * Show warning when screenshot attempt is detected
   */
  private showScreenshotWarning(): void {
    this.showError('Screenshots and screen recording are not allowed for this content.');
  }

  /**
   * Handle video ended event - mark lecture as complete
   */
  onVideoEnded(event: Event): void {
    this.isPlaying = false;
    if (!this.completionApiCalled) {
      this.completeLecture();
    }
  }

  /**
   * Fetch lectures for a specific section
   */
  private fetchLecturesForSection(sectionId: number): void {
    if (!sectionId || !this.userId) {
      console.error('Missing required data for fetching lectures');
      return;
    }

    this.isLoadingLectures = true;

    const payload = {
      section_id: sectionId,
      logged_user_id: this.userId,
    };

    this.http.post(`${this.baseUrl}/fetch_lectures`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.allLectures = this.processLecturesData(response);
          this.isLoadingLectures = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching lectures:', err);
          this.showError('Failed to load lectures for this section.');
          this.isLoadingLectures = false;
        }
      });
  }

  /**
   * Process lectures data to clean URLs
   */
  private processLecturesData(lectures: any[]): any[] {
    if (!Array.isArray(lectures)) return [];
    
    return lectures.map((lecture: any) => this.processLectureData(lecture));
  }

  /**
   * Enroll user in lecture via API
   */
  private enrollLecture(lecture: any): void {
    if (!lecture?.lecture_id || !this.userId) {
      console.error('Missing required data for lecture enrollment');
      return;
    }

    const payload = {
      lecture_id: lecture.lecture_id,
      user_id: this.userId,
      start_date: new Date().toISOString().split('T')[0],
    };

    this.http.post(`${this.baseUrl}/enroll_lecture`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('User enrolled in lecture successfully');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error enrolling in lecture:', err);
          // Don't show error to user as this is a background operation
        }
      });
  }

  /**
   * Complete lecture via API
   */
  private completeLecture(): void {
    if (!this.selectedLecture?.lecture_id || !this.userId) {
      console.error('Missing required data for lecture completion');
      return;
    }

    this.completionApiCalled = true;

    const payload = {
      lecture_id: this.selectedLecture.lecture_id,
      end_date: new Date().toISOString().split('T')[0],
      user_id: this.userId
    };

    this.http.post(`${this.baseUrl}/complete_lecture`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.showSuccess('Lecture marked as complete!');
          
          // Check if this is the last lecture in the section
          this.checkAndCompleteSection();
          
          this.fetchLecturesForSection(this.data.section_id);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error completing lecture:', err);
          this.completionApiCalled = false;
          this.showError('Failed to mark lecture as complete.');
        }
      });
  }

  /**
   * Check if all lectures are completed and complete section if needed
   */
  private checkAndCompleteSection(): void {
    if (!this.allLectures || this.allLectures.length === 0) {
      return;
    }

    // Find the current lecture index
    const currentLectureIndex = this.allLectures.findIndex(
      lecture => lecture.lecture_id === this.selectedLecture.lecture_id
    );

    // Check if this is the last lecture
    const isLastLecture = currentLectureIndex === this.allLectures.length - 1;

    if (isLastLecture) {
      // Since we just completed this lecture, we can call complete_section
      this.completeSection();
    }
  }

  /**
   * Complete section via API when the last lecture is completed
   */
  private completeSection(): void {
    if (!this.data?.section_id || !this.userId) {
      console.error('Missing required data for section completion');
      return;
    }

    const payload = {
      section_id: this.data.section_id,
      user_id: this.userId,
      end_date: new Date().toISOString().split('T')[0],
    };

    this.http.post(`${this.baseUrl}/complete_section`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('Section marked as complete:', res);
          
          // Check if this is the last section to complete the course
          if (this.isLastSection) {
            this.completeCourse();
          } else {
            this.showSuccess('🎉 Section completed! Great job!');
            
            // Close dialog after a brief delay to show the success message
            setTimeout(() => {
              this.dialogRef.close(true);
            }, 1500);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error completing section:', err);
          // Don't show error to user as lecture was still completed successfully
        }
      });
  }

  /**
   * Complete course via API when the last lecture of the last section is completed
   */
  private completeCourse(): void {
    if (!this.courseId || !this.userId) {
      console.error('Missing required data for course completion');
      return;
    }

    const payload = {
      course_id: this.courseId,
      user_id: this.userId,
      end_date: new Date().toISOString().split('T')[0],
    };

    this.http.post(`${this.baseUrl}/complete_course`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.showSuccess('🎉🎓 Congratulations! You have completed the entire course!');
          console.log('Course marked as complete:', res);
          
          // Close dialog after a longer delay to show the success message
          setTimeout(() => {
            this.dialogRef.close(true);
          }, 2500);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error completing course:', err);
          this.showError('Failed to mark course as complete. Please contact support.');
        }
      });
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
}
