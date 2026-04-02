import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { trigger, style, transition, animate } from '@angular/animations';

interface Student {
  position: number;
  name: string;
  score: number;
  photo: string;
  rank_change?: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    AngularMaterialModule,
    FormsModule
  ],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LeaderboardComponent implements OnInit {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  loading = signal(false);
  allStudents = signal<Student[]>([]);

  topStudents = computed(() => this.allStudents().slice(0, 3));
  otherStudents = computed(() => this.allStudents().slice(3));

  searchTerm = signal('');
  filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const others = this.otherStudents();
    if (!term) return others;
    return others.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.position.toString().includes(term)
    );
  });

  allCourses: any[] = [];
  selectedCourseId: any = null;
  defaultImage: string = 'assets/Images/null_image.png';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchAllCourses();
    this.fetchAllLeaderboard();
  }

  fetchAllCourses(): void {
    this.http.get(`${this.baseUrl}/all_course_dropdown`).subscribe({
      next: (res: any) => {
        this.allCourses = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }

  onCourseChange(): void {
    this.fetchAllLeaderboard();
  }

  fetchAllLeaderboard(): void {
    this.loading.set(true);
    const requestBody = this.selectedCourseId ? { course_id: this.selectedCourseId } : {};

    this.http.post<any>(`${this.baseUrl}/fetch_leaderboard_points`, requestBody).subscribe({
      next: (res: any) => {
        console.log('Leaderboard API Raw Response:', res);
        const data = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);

        if (!data || data.length === 0) {
          this.allStudents.set([]);
          this.loading.set(false);
          this.cdr.detectChanges();
          return;
        }

        const mapped = data.map((user: any) => ({
          name: user.user_name || 'Unknown',
          score: parseFloat(user.total_points) || 0,
          photo: user.profile_image ? (user.profile_image.startsWith('http') ? user.profile_image : `${this.storageUrl}/${user.profile_image}`) : this.defaultImage,
          rank_change: 'neutral' as const,
          position: 0, // Placeholder
          rawAppUserId: user.user_id
        })).sort((a: any, b: any) => b.score - a.score);

        const ranked = mapped.map((s: any, i: number) => ({ ...s, position: i + 1 }));

        console.log('Final Ranked Students:', ranked);
        this.allStudents.set(ranked);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Leaderboard API error:', err);
        this.allStudents.set([]);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  updateSearch(term: string): void {
    this.searchTerm.set(term);
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.cdr.detectChanges();
  }

  onImageError(event: any): void {
    event.target.src = this.defaultImage;
  }
}
