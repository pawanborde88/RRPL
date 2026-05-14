import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { CommonService } from '../../../../Service/common/common.service';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-add-edit-source-target',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
  templateUrl: './add-edit-source-target.html',
  styleUrl: './add-edit-source-target.scss',
  providers: [DatePipe]
})
export class AddEditSourceTarget implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddEditSourceTarget>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly sourcesList = signal<any[]>([]);
  targetForm!: FormGroup;
  isEditMode = false;
  userId = Number(sessionStorage.getItem('session_id'));

  ngOnInit(): void {
    this.isEditMode = !!this.data.editData;
    this.initForm();
    this.fetchProjects();
    this.fetchSources();
    if (this.isEditMode) {
      this.patchFormValues();
    }
    this.setupChangeListeners();
  }

  private setupChangeListeners(): void {
    this.targetForm.get('project_id')?.valueChanges.subscribe(() => this.fetchExistingTargets());
    this.targetForm.get('target_from')?.valueChanges.subscribe(() => this.fetchExistingTargets());
    this.targetForm.get('target_to')?.valueChanges.subscribe(() => this.fetchExistingTargets());
  }

  private initForm(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.targetForm = this.fb.group({
      project_id: [null, Validators.required],
      target_from: [firstDay, Validators.required],
      target_to: [lastDay, Validators.required],
      sourceTargets: this.fb.array([]),
      sourceBudgets: this.fb.array([])
    });
  }

  get sourceTargets(): FormArray {
    return this.targetForm.get('sourceTargets') as FormArray;
  }

  get sourceBudgets(): FormArray {
    return this.targetForm.get('sourceBudgets') as FormArray;
  }

  private addSourceRow(source: any, data: any = null): void {
    this.sourceTargets.push(this.fb.group({
      source_id: [source.source_id],
      source_name: [source.source || source.source_name],
      site_visit_target: [data?.site_visit_target || 0, [Validators.required, Validators.min(0)]],
      lead_target: [data?.lead_target || 0, [Validators.required, Validators.min(0)]],
      booking_target: [data?.booking_target || 0, [Validators.required, Validators.min(0)]],
      source_target_id: [data?.source_target_id || null]
    }));
  }

  private addBudgetRow(source: any, data: any = null): void {
    this.sourceBudgets.push(this.fb.group({
      source_id: [source.source_id],
      source_name: [source.source || source.source_name],
      budget: [data?.amount || 0, [Validators.required, Validators.min(0)]],
      budget_id: [data?.budget_id || null]
    }));
  }

  private fetchProjects(): void {
    this.commonService.fetchUserProjectDropdown(this.userId).subscribe({
      next: (res) => this.projectsList.set(res || []),
      error: (err) => console.error('Error fetching projects:', err)
    });
  }

  private fetchSources(): void {
    this.commonService.fetchSources().subscribe({
      next: (res) => {
        this.sourcesList.set(res || []);
        this.fetchExistingTargets();
      },
      error: (err) => console.error('Error fetching sources:', err)
    });
  }

  private fetchExistingTargets(): void {
    const projectId = this.targetForm.get('project_id')?.value;
    const targetFrom = this.targetForm.get('target_from')?.value;
    const targetTo = this.targetForm.get('target_to')?.value;

    if (!projectId || !targetFrom || !targetTo) return;

    const formattedFrom = this.datePipe.transform(targetFrom, 'yyyy-MM-dd');
    const formattedTo = this.datePipe.transform(targetTo, 'yyyy-MM-dd');

    this.loading.set(true);
    forkJoin({
      targets: this.commonService.fetchSourceTarget({
        project_id: projectId,
        target_from: formattedFrom,
        target_to: formattedTo
      }),
      budgets: this.commonService.fetchBudget({
        project_id: [projectId],
        year: targetFrom.getFullYear().toString(),
        month: (targetFrom.getMonth() + 1).toString()
      })
    }).pipe(
      finalize(() => {
        this.loading.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ targets, budgets }) => {
        const currentSources = this.sourcesList();
        
        if (currentSources.length === 0) {
          console.warn('Sources list empty, will retry mapping once sources are loaded');
          return;
        }

        this.sourceTargets.clear();
        this.sourceBudgets.clear();
        
        console.log('Populating rows for sources:', currentSources.length, currentSources);
        
        currentSources.forEach(source => {
          const existingTarget = targets?.find((t: any) => t.source_id === source.source_id);
          this.addSourceRow(source, existingTarget);

          const existingBudget = budgets?.find((b: any) => b.source_id === source.source_id);
          this.addBudgetRow(source, existingBudget);
        });
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching existing data:', err)
    });
  }

  private patchFormValues(): void {
    const editData = this.data.editData;
    this.targetForm.patchValue({
      project_id: editData.project_id,
      target_from: editData.target_from,
      target_to: editData.target_to,
    });

    // For edit mode, we might only be editing one source or multiple.
    // If it's a single record being passed, we still show the list but highlight/populate that one.
    // But usually, the request implies showing all.
    // For now, if we have editData, we clear and add just this one, or find it in the list.
    this.sourceTargets.clear();
    this.addSourceRow({ source_id: editData.source_id, source: editData.source_name || 'Source' }, editData);
    this.cdr.detectChanges();
  }

  trackBySource(index: number, item: any): any {
    return item.get('source_id')?.value || index;
  }

  onSave(): void {
    if (this.targetForm.invalid) {
      this.targetForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.targetForm.value;
    const targetFrom = this.datePipe.transform(formValue.target_from, 'yyyy-MM-dd');
    const targetTo = this.datePipe.transform(formValue.target_to, 'yyyy-MM-dd');

    const sourceTargets = formValue.sourceTargets
      .filter((st: any) => st.site_visit_target > 0 || st.lead_target > 0 || st.booking_target > 0)
      .map((st: any) => ({
        source_id: st.source_id,
        site_visit_target: st.site_visit_target,
        lead_target: st.lead_target,
        booking_target: st.booking_target,
        target_from: targetFrom,
        target_to: targetTo,
        ...(st.source_target_id ? { source_target_id: st.source_target_id } : {})
      }));

    if (sourceTargets.length === 0) {
      this.showSnackBar('Please enter at least one target value', 'error');
      this.loading.set(false);
      return;
    }

    const payload = {
      project_id: formValue.project_id,
      source_budget: sourceTargets,
      created_by: this.userId,
      updated_by: this.userId
    };

    this.commonService.bulkAddSourceTarget(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          this.showSnackBar('Error saving source targets', 'error');
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.dialog.open(SuccessDialogComponent, {
            data: { 
              status: res.success, 
              message: res.message || (res.success ? 'Source target added/updated successfully' : 'Error saving source targets') 
            }
          });
          if (res.success) {
            this.dialogRef.close(true);
          }
        }
      });
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'error' ? ['snackbar-error'] : undefined
    });
  }



  onCancel(): void {
    this.dialogRef.close(false);
  }


}
