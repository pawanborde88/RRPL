import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-notice-board',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    AngularMaterialModule,
    FormsModule
  ],
  templateUrl: './notice-board.component.html',
  styleUrl: './notice-board.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.6s cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: ''
        }),
        animate('0.4s ease-in', style({
          opacity: 1,
          transform: ''
        }))
      ])
    ])
  ]
})
export class NoticeBoardComponent {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  loading: boolean = false;
  notices: any[] = [];
  allCourses: any[] = [];
  selectedCourseId: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAllCourses();
    this.fetchNoticeBoard();
  }

  fetchAllCourses(): void {
    this.http.get(`${this.baseUrl}/all_course_dropdown`).subscribe({
      next: (res: any) => {
        this.allCourses = res;
      },
      error: (err: any) => {
        console.error('Failed to load courses.', err);
      }
    });
  }

  onCourseChange(): void {
    this.fetchNoticeBoard();
  }

  fetchNoticeBoard(): void {
    this.loading = true;
    
    // Prepare request body - always pass course_id (null if no course selected)
    const requestBody: any = {
      course_id: this.selectedCourseId !== null && this.selectedCourseId !== undefined 
        ? this.selectedCourseId 
        : null
    };

    console.log('Fetching notice board with params:', requestBody);

    this.http.post<any[]>(`${this.baseUrl}/fetch_notice_board`, requestBody).subscribe({
      next: (data) => {
        console.log('API Response:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.warn('Invalid or empty notice board data');
          this.notices = [];
          this.loading = false;
          return;
        }

        // Map the API response to display format
        this.notices = data.map((notice) => ({
          id: notice.notice_board_id,
          userId: notice.user_id,
          name: notice.name || 'Unknown User',
          notice: notice.notice,
          createdAt: notice.created_at,
          profileImage: notice.profile_image 
            ? `${this.storageUrl}/${notice.profile_image}` 
            : 'assets/Images/null_image.png'
        }));

        console.log('Mapped notices:', this.notices);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notice board data:', err);
        this.notices = [];
        this.loading = false;
      }
    });
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

