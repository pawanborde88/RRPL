import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-attend-meeting-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CostomLoadingComponent
  ],
  templateUrl: './attend-meeting-dialog.component.html',
  styleUrl: './attend-meeting-dialog.component.scss'
})
export class AttendMeetingDialogComponent implements OnInit{

  private readonly baseUrl = environment.API_URL;
  private readonly roleId = Number(sessionStorage.getItem('role_id'));
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  allmeetingData: any[] = [];
  meetingDetails: any = null;
  isLoading: boolean = false;
  allUserList: any[] = [];
  tasks: any[] = [];
  editingRowIndex: number | null = null;
  emptyRows: any[] = []; // Array to store empty rows for new tasks
  
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<AttendMeetingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  // Inline editing form
  inlineForm = new FormGroup({
    task: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
    responsible_user_id: new FormControl<number[]>([], [Validators.required, Validators.minLength(1)]),
    actionable: new FormControl<string>('', [Validators.required, Validators.minLength(10)]),
    completion_time: new FormControl<number | null>(null, [Validators.required]),
    reviewer_id: new FormControl<number[]>([], [Validators.required, Validators.minLength(1)]),
    supporter_id: new FormControl<number[]>([], [Validators.required, Validators.minLength(1)]),
    status_id: new FormControl<number | null>(null, [Validators.required])
  });

  // Getter methods for form controls to avoid type issues
  get inlineTaskControl(): FormControl<string> {
    return this.inlineForm.get('task') as FormControl<string>;
  }

  get inlineResponsibleControl(): FormControl<number[]> {
    return this.inlineForm.get('responsible_user_id') as FormControl<number[]>;
  }

  get inlineActionablesControl(): FormControl<string> {
    return this.inlineForm.get('actionable') as FormControl<string>;
  }

  get inlineCompletionTimeControl(): FormControl<number | null> {
    return this.inlineForm.get('completion_time') as FormControl<number | null>;
  }

  get inlineReviewerControl(): FormControl<number[]> {
    return this.inlineForm.get('reviewer_id') as FormControl<number[]>;
  }

  get inlineSupporterControl(): FormControl<number[]> {
    return this.inlineForm.get('supporter_id') as FormControl<number[]>;
  }

  get inlineStatusControl(): FormControl<number | null> {
    return this.inlineForm.get('status_id') as FormControl<number | null>;
  }
  
  ngOnInit(): void {
    console.log(this.data);

    if(this.data.meetingId){
      this.fetchMeetingDetails();
      this.fetchTasks();
    }
  }

  // Inline editing methods
  startInlineEdit(index: number, task: any): void {
    this.editingRowIndex = index;
    
    this.inlineForm.patchValue({
      task: task.task || '',
      responsible_user_id: task.responsible_user_id || [],
      actionable: task.actionable || '',
      completion_time: task.completion_time || null,
      reviewer_id: task.reviewer_id || [],
      supporter_id: task.supporter_id || [],
      status_id: task.status_id || null
    });
  }

  cancelInlineEdit(): void {
    // If we were editing an empty row, remove it
    if (this.editingRowIndex !== null && this.isEmptyRow(this.editingRowIndex)) {
      this.removeEmptyRow(this.editingRowIndex);
    }
    
    this.editingRowIndex = null;
    this.inlineForm.reset();
  }

  saveInlineEdit(): void {
    const formData = this.inlineForm.value;
      
    // Get the task being edited
    const editingTask = this.tasks[this.editingRowIndex!];
    if (editingTask && editingTask.meeting_task_id) {
      // Edit existing task
      this.http.post(`${this.baseUrl}/edit_meeting_task`, {
        ...formData,
        meeting_id: this.data.meetingId,
        meeting_task_id: editingTask.meeting_task_id,
        created_by: this.userId
      }).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
            this.cancelInlineEdit();
            this.fetchTasks();
          } else {
            this.snackBar.open(res.message || 'Failed to update task', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.snackBar.open('Error updating task', 'Close', { duration: 3000 });
        }
      });
    }
  }

  addNewRow(): void {
    const newTask = {
      meeting_task_id: null,
      task: '',
      responsible_user_id: [],
      actionable: '',
      completion_time: null,
      reviewer_id: [],
      supporter_id: [],
      status_id: null,
      isNew: true,
      isEmptyRow: true // Flag to identify empty rows
    };
    
    this.emptyRows.push(newTask);
    this.startInlineEdit(this.tasks.length + this.emptyRows.length - 1, newTask);
  }

  removeEmptyRow(index: number): void {
    // Remove from emptyRows array
    const emptyRowIndex = index - this.tasks.length;
    if (emptyRowIndex >= 0 && emptyRowIndex < this.emptyRows.length) {
      this.emptyRows.splice(emptyRowIndex, 1);
      // If we were editing this row, cancel the edit
      if (this.editingRowIndex === index) {
        this.cancelInlineEdit();
      }
    }
  }

  saveNewTask(): void {
    const formData = this.inlineForm.value;
      
    this.http.post(`${this.baseUrl}/add_meeting_task`, {
      ...formData,
      meeting_id: this.data.meetingId,
      created_by: this.userId
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.snackBar.open('Task added successfully', 'Close', { duration: 3000 });
          this.cancelInlineEdit();
          // Remove the empty row after successful save
          this.removeEmptyRow(this.editingRowIndex!);
          this.fetchTasks();
        } else {
          this.snackBar.open(res.message || 'Failed to add task', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error adding task:', error);
        this.snackBar.open('Error adding task', 'Close', { duration: 3000 });
      }
    });
  }

  deleteTask(taskId: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.http.post(`${this.baseUrl}/delete_meeting_task`, { meeting_task_id: taskId }).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
            this.fetchTasks();
          } else {
            this.snackBar.open(res.message || 'Failed to delete task', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.snackBar.open('Error deleting task', 'Close', { duration: 3000 });
        }
      });
    }
  }

  fetchTasks(): void {
    this.http.post(`${this.baseUrl}/fetch_meeting_task`, { meeting_id: this.data.meetingId }).subscribe({
      next: (res: any) => {
        if (res) {
          this.tasks = res || [];
        } else {
          this.snackBar.open(res.message || 'Failed to fetch tasks', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error fetching tasks:', error);
        this.snackBar.open('Error fetching tasks', 'Close', { duration: 3000 });
      }
    });
  }

  // Helper methods
  getUserName(userId: number): string {
    const user = this.allUserList.find(u => u.user_id === userId);
    return user ? (user.name || user.username || 'Unknown User') : 'Unknown User';
  }

  getResponsibleUserNames(task: any): string {
    // Use the responsible_users array directly from API response if available
    if (task.responsible_users && Array.isArray(task.responsible_users) && task.responsible_users.length > 0) {
      return task.responsible_users.join(', ');
    }
    
    // Fallback to ID-based lookup if responsible_users is not available
    if (!task.responsible_user_id || !Array.isArray(task.responsible_user_id) || task.responsible_user_id.length === 0) {
      return 'Not assigned';
    }
    
    const userNames = task.responsible_user_id.map((userId: number) => this.getUserName(userId));
    return userNames.join(', ');
  }

  getReviewerUserNames(task: any): string {
    // Use the reviewers array directly from API response if available
    if (task.reviewers && Array.isArray(task.reviewers) && task.reviewers.length > 0) {
      return task.reviewers.join(', ');
    }
    
    // Fallback to ID-based lookup if reviewers is not available
    if (!task.reviewer_id || !Array.isArray(task.reviewer_id) || task.reviewer_id.length === 0) {
      return 'Not assigned';
    }
    
    const userNames = task.reviewer_id.map((userId: number) => this.getUserName(userId));
    return userNames.join(', ');
  }

  getSupporterUserNames(task: any): string {
    // Use the supporters array directly from API response if available
    if (task.supporters && Array.isArray(task.supporters) && task.supporters.length > 0) {
      return task.supporters.join(', ');
    }
    
    // Fallback to ID-based lookup if supporters is not available
    if (!task.supporter_id || !Array.isArray(task.supporter_id) || task.supporter_id.length === 0) {
      return 'Not assigned';
    }
    
    const userNames = task.supporter_id.map((userId: number) => this.getUserName(userId));
    return userNames.join(', ');
  }

  getStatusText(statusId: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'Pending',
      2: 'In Progress',
      3: 'Completed',
      4: 'On Hold'
    };
    return statusMap[statusId] || 'Unknown';
  }

  isRowEditing(index: number): boolean {
    return this.editingRowIndex === index;
  }

  // Get all rows (existing tasks + empty rows) for display
  getAllRows(): any[] {
    return [...this.tasks, ...this.emptyRows];
  }

  // Check if a row is an empty row
  isEmptyRow(index: number): boolean {
    return index >= this.tasks.length;
  }

  // Get the actual task object for a given index
  getTaskByIndex(index: number): any {
    if (index < this.tasks.length) {
      return this.tasks[index];
    } else {
      return this.emptyRows[index - this.tasks.length];
    }
  }
 
  fetchMeetingDetails(): void {
    this.isLoading = true;
    this.http.post(`${this.baseUrl}/fetch_internal_meeting`, {meeting_id: this.data.meetingId}).subscribe({
      next: (res: any) => {
        if(res.success){
          this.allmeetingData = res.data;
          if (this.allmeetingData.length > 0) {
            this.meetingDetails = this.allmeetingData[0];

            this.fetchAllUsersList(this.meetingDetails.attendees);
          }
        } else {
          this.snackBar.open(res.message || 'Failed to fetch meeting details', 'Close', {
            duration: 3000
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching meeting details:', error);
        this.snackBar.open('Error fetching meeting details', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }
  private fetchAllUsersList(attendees: any[]): void {
 

    // Send all role IDs in a single API call
    this.http.post(`${this.baseUrl}/fetch_users`, { user_id: attendees }).subscribe({
      next: (res: any) => {
        this.allUserList = res || [];
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch users.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
