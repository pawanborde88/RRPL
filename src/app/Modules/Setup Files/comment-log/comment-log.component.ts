import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
  takeUntil,
  switchMap,
  catchError,
  finalize,
  tap,
  startWith,
  distinctUntilChanged,
  debounceTime,
  filter,
} from 'rxjs/operators';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { ConfirmDialogComponent } from '../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { SuccessDialogComponent } from '../../../Common/success-dialog/success-dialog.component';
import { CommentLogService } from './comment-log.service';
import {
  CommentLog,
  LeadLevel,
  CallStatus,
  DialogData,
  CommentFormData,
} from './comment-log.models';
import { COMMENT_LOG_CONSTANTS } from './comment-log.constants';

/**
 * Highly optimized Comment Log Component
 * Features:
 * - OnPush change detection for optimal performance
 * - RxJS reactive patterns with proper memory management
 * - Type-safe models and interfaces
 * - Service layer abstraction
 * - Smart subscription management with takeUntil
 * - Immutable data patterns
 * - Memoized computed values
 * - TrackBy functions for efficient list rendering
 */
@Component({
  selector: 'app-comment-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './comment-log.component.html',
  styleUrls: ['./comment-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance boost
  providers: [DatePipe], // Inject DatePipe instead of creating instance
})
export class CommentLogComponent implements OnInit, OnDestroy {
  /* ---------------------------------
   * Reactive Streams (Observables)
   * ---------------------------------*/
  readonly comments$: Observable<CommentLog[]>;
  readonly loading$: Observable<boolean>;
  readonly leadLevels$: Observable<LeadLevel[]>;
  callStatus$: Observable<CallStatus[]> = of([]);

  /* ---------------------------------
   * Constants & Configuration
   * ---------------------------------*/
  readonly constants = COMMENT_LOG_CONSTANTS;
  readonly minDate: Date = new Date();
  readonly maxDate: Date = this.calculateMaxDate();

  /* ---------------------------------
   * User context from session
   * ---------------------------------*/
  private readonly userId: number = this.getUserId();
  private readonly roleId: number = this.getRoleId();

  /* ---------------------------------
   * Reactive Form
   * ---------------------------------*/
  readonly addCommentForm: FormGroup;

  /* ---------------------------------
   * Memory Management
   * ---------------------------------*/
  private readonly destroy$ = new Subject<void>();

  /* ---------------------------------
   * Computed Properties (Memoized)
   * ---------------------------------*/
  private cachedShowFollowUp: boolean | null = null;
  private lastLeadLevelId: number | null = null;

  /* ---------------------------------
   * Constructor - DI injection
   * ---------------------------------*/
  constructor(
    private readonly commentService: CommentLogService,
    private readonly fb: FormBuilder,
    private readonly datePipe: DatePipe,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData,
    private readonly dialogRef: MatDialogRef<CommentLogComponent>
  ) {
    // Initialize observables from service
    this.comments$ = this.commentService.comments$;
    this.loading$ = this.commentService.loading$;
    this.leadLevels$ = this.commentService.fetchLeadLevels().pipe(
      catchError((error) => {
        this.showError(this.constants.ERROR_MESSAGES.FETCH_LEAD_LEVELS);
        return of([]);
      })
    );

    // Initialize form with FormBuilder
    this.addCommentForm = this.createForm();
  }

  /* ---------------------------------
   * Lifecycle Hooks
   * ---------------------------------*/
  ngOnInit(): void {
    console.log('ngOnInit', this.data);
    this.loadComments();
    this.setupLeadLevelListener();
    this.setupDynamicValidators();
  }

  ngOnDestroy(): void {
    // ⚡ Cleanup all subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
    this.commentService.resetState();
  }

  /* ---------------------------------
   * Form Creation & Initialization
   * ---------------------------------*/
  private createForm(): FormGroup {
    const currentDate = new Date();
    
    // Determine if this component type requires lead level and call status
    const requiresLeadLevelAndCallStatus = 
      this.data?.for === this.constants.COMPONENT_TYPE.LEAD_FOLLOW_UP || 
      this.data?.for === this.constants.COMPONENT_TYPE.ENQUIRIES;
    
    return this.fb.group({
      created_by: [this.userId],
      enquiry_id: [this.data?.rowData?.project_enq_id],
      token_id: [this.data?.rowData?.token_id],
      project_lead_id: [this.data?.rowData?.project_lead_id],
      lead_level_id: [null, requiresLeadLevelAndCallStatus ? Validators.required : null],
      project_id: [this.normalizeProjectId(this.data?.rowData?.project_id)],
      call_status_id: [null, requiresLeadLevelAndCallStatus ? Validators.required : null],
      follow_up_date: [this.datePipe.transform(currentDate, this.constants.DATE_FORMAT.API_DATE)],
      follow_up_period: [this.datePipe.transform(currentDate, this.constants.DATE_FORMAT.API_TIME)],
      comment: [''],
      remark: [''],
    });
  }

  /* ---------------------------------
   * Form Setup & Reactive Logic
   * ---------------------------------*/
  private setupLeadLevelListener(): void {
    this.addCommentForm
      .get('lead_level_id')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(), // ⚡ Only emit when value actually changes
        filter((value): value is number => !!value), // Type guard
        switchMap((leadLevelId: number) => {
          // ⚡ switchMap cancels previous requests
          this.cachedShowFollowUp = null; // Reset cache
          this.lastLeadLevelId = leadLevelId;
          
          return this.commentService.fetchCallStatus(leadLevelId).pipe(
            catchError((error) => {
              this.showError(this.constants.ERROR_MESSAGES.FETCH_CALL_STATUS);
              return of([]);
            })
          );
        })
      )
      .subscribe((callStatuses: CallStatus[]) => {
        this.callStatus$ = of(callStatuses);
        this.cdr.markForCheck(); // ⚡ Manually trigger change detection with OnPush
      });
  }

  private setupDynamicValidators(): void {
    const commentControl = this.addCommentForm.get('comment');
    const remarkControl = this.addCommentForm.get('remark');

    if (this.data?.for === this.constants.COMPONENT_TYPE.LEAD_FOLLOW_UP) {
      remarkControl?.setValidators(Validators.required);
      commentControl?.clearValidators();
    } else {
      commentControl?.setValidators(Validators.required);
      remarkControl?.clearValidators();
    }

    commentControl?.updateValueAndValidity();
    remarkControl?.updateValueAndValidity();
  }

  /* ---------------------------------
   * Form Submission
   * ---------------------------------*/
  onSubmit(): void {
    if (this.addCommentForm.invalid) {
      this.addCommentForm.markAllAsTouched();
      return;
    }

    const formData = this.buildFormData();

    this.commentService
      .submitComment(this.data.apiUrl, formData)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((response) => {
          // Show success dialog and wait for it to close
          return this.dialog
            .open(SuccessDialogComponent, {
              autoFocus: false,
              data: { message: response.message },
            })
            .afterClosed();
        }),
        tap(() => {
          // Reload comments after successful submission
          this.loadComments();
          this.resetFormFields();
          this.dialogRef.close(true);
        }),
        catchError((error) => {
          this.showError(this.constants.ERROR_MESSAGES.SUBMIT_COMMENT);
          return of(null);
        })
      )
      .subscribe();
  }

  private buildFormData(): CommentFormData {
    const rawValue = this.addCommentForm.getRawValue();
    const formData: CommentFormData = {
      ...rawValue,
      created_by: this.userId,
      project_id: this.normalizeProjectId(this.data?.rowData?.project_id),
      follow_up_date: this.datePipe.transform(
        rawValue.follow_up_date,
        this.constants.DATE_FORMAT.API_DATE
      ) || undefined,
    };

    // Context-specific data mapping
    if (this.data?.for === this.constants.COMPONENT_TYPE.ENQUIRIES) {
      formData.enquiry_id = this.data?.rowData?.project_enq_id;
    } else if (this.data?.for === this.constants.COMPONENT_TYPE.LEAD_FOLLOW_UP) {
      formData.project_lead_id = rawValue.project_lead_id;
      formData.remark = rawValue.remark;
    }

    return formData;
  }

  private resetFormFields(): void {
    // Reset only user-input fields, keep context data
    ['call_status_id', 'lead_level_id', 'comment', 'remark'].forEach((field) => {
      this.addCommentForm.get(field)?.reset();
    });
  }
  /* ---------------------------------
   * Data Loading
   * ---------------------------------*/
  private loadComments(): void {
    const apiEndpoint =
      this.data?.for === this.constants.COMPONENT_TYPE.LEAD_FOLLOW_UP
        ? this.constants.API_ENDPOINTS.FETCH_LEAD_FOLLOW_UP
        : this.constants.API_ENDPOINTS.FETCH_COMMENT;

    const requestData = {
      [this.data?.payload]: this.data?.request,
    };

    this.commentService
      .fetchComments(apiEndpoint, requestData)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.showError(this.constants.ERROR_MESSAGES.FETCH_COMMENTS);
          return of([]);
        })
      )
      .subscribe(() => {
        this.cdr.markForCheck(); // ⚡ Trigger change detection for OnPush
      });
  }

  /* ---------------------------------
   * Delete Operation
   * ---------------------------------*/
  deleteComment(comment: CommentLog): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: this.constants.DIALOG.MIN_WIDTH,
        data: { message: this.constants.CONFIRMATION_MESSAGES.DELETE_COMMENT },
      })
      .afterClosed()
      .pipe(
        takeUntil(this.destroy$),
        filter((confirmed) => !!confirmed), // ⚡ Only proceed if confirmed
        switchMap(() => {
          const { apiEndpoint, payloadKey, commentId } =
            this.getDeleteParams(comment);

          if (!commentId) {
            this.showError(this.constants.ERROR_MESSAGES.INVALID_COMMENT_ID);
            return of(null);
          }

          const payload = { [payloadKey]: commentId };
          return this.commentService.deleteComment(apiEndpoint, payload);
        }),
        tap((response) => {
          if (response) {
            this.showSuccess(this.constants.SUCCESS_MESSAGES.DELETE_COMMENT);
            this.loadComments(); // Refresh the list
          }
        }),
        catchError((error) => {
          this.showError(this.constants.ERROR_MESSAGES.DELETE_COMMENT);
          return of(null);
        })
      )
      .subscribe();
  }

  private getDeleteParams(comment: CommentLog): {
    apiEndpoint: string;
    payloadKey: string;
    commentId: number | undefined;
  } {
    const isFollowUp =
      this.data?.for === this.constants.COMPONENT_TYPE.LEAD_FOLLOW_UP;

    return {
      apiEndpoint: isFollowUp
        ? this.constants.API_ENDPOINTS.DELETE_LEAD_FOLLOW_UP
        : this.constants.API_ENDPOINTS.DELETE_COMMENT,
      payloadKey: isFollowUp ? 'lead_follow_up_id' : 'comment_log_id',
      commentId: isFollowUp
        ? comment.lead_follow_up_id
        : comment.comment_log_id,
    };
  }

  /* ---------------------------------
   * Computed Properties & Helpers
   * ---------------------------------*/
  shouldShowFollowUpFields(): boolean {
    // ⚡ Memoization to avoid unnecessary recalculations
    const currentLeadLevelId = Number(
      this.addCommentForm.get('lead_level_id')?.value
    );

    if (currentLeadLevelId === this.lastLeadLevelId && this.cachedShowFollowUp !== null) {
      return this.cachedShowFollowUp;
    }

    this.lastLeadLevelId = currentLeadLevelId;
    // Hide follow-up fields if lead level is 13, 24, or 25
    this.cachedShowFollowUp =
      currentLeadLevelId !== this.constants.LEAD_LEVEL.NO_FOLLOW_UP_REQUIRED &&
      currentLeadLevelId !== this.constants.LEAD_LEVEL.NO_FOLLOW_UP_REQUIRED_ALT &&
      currentLeadLevelId !== this.constants.LEAD_LEVEL.NO_FOLLOW_UP_REQUIRED_ALT_2;

    return this.cachedShowFollowUp;
  }

  /* ---------------------------------
   * TrackBy Functions for *ngFor
   * ⚡ Improves rendering performance
   * ---------------------------------*/
  trackByCommentId(index: number, comment: CommentLog): number | string {
    return comment.comment_log_id || comment.lead_follow_up_id || index;
  }

  trackByLeadLevelId(index: number, level: LeadLevel): number {
    return level.lead_level_id;
  }

  trackByCallStatusId(index: number, status: CallStatus): number {
    return status.call_status_id;
  }

  /* ---------------------------------
   * Utility Methods
   * ---------------------------------*/
  private getUserId(): number {
    return Number(sessionStorage.getItem(this.constants.STORAGE_KEYS.SESSION_ID)) || 0;
  }

  private getRoleId(): number {
    return Number(sessionStorage.getItem(this.constants.STORAGE_KEYS.ROLE_ID)) || 0;
  }

  private calculateMaxDate(): Date {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + this.constants.FOLLOW_UP.MAX_DAYS_AHEAD);
    return maxDate;
  }

  private normalizeProjectId(projectId: number | number[] | undefined): number | null {
    if (Array.isArray(projectId)) {
      return projectId.length > 0 ? projectId[0] : null;
    }
    return projectId ?? null;
  }

  private showError(message: string): void {
    this.snackBar.open(message, this.constants.SNACKBAR.CLOSE_ACTION, {
      duration: this.constants.SNACKBAR.DURATION,
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, this.constants.SNACKBAR.CLOSE_ACTION, {
      duration: this.constants.SNACKBAR.DURATION,
    });
  }
}
