import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, Inject, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, of, tap } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../../../Common/success-dialog/success-dialog.component';
import { ReceiptsService, type Project, type Wing, type Unit } from '../../../../Recovery/Recipts/receipts.service';
import { environment } from '../../../../../../../../environments/environment';

interface PaymentStage {
  payment_stage_id: number;
  payment_stage: string;
  percentage: number;
}

@Component({
  selector: 'app-add-demand-generation',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-demand-generation.component.html',
  styleUrl: './add-demand-generation.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDemandGenerationComponent implements OnInit {
  private readonly receiptsService = inject(ReceiptsService);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<AddDemandGenerationComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  private readonly baseUrl = environment.API_URL;

  readonly userId = signal(Number(sessionStorage.getItem('session_id')) || 0);

  // Signals for reactive state management
  readonly loading = signal<boolean>(false);
  readonly projects = signal<Project[]>([]);
  readonly wings = signal<Wing[]>([]);
  readonly units = signal<Unit[]>([]);
  readonly stages = signal<PaymentStage[]>([]);

  // Form
  readonly addDemandGenerationForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | string | null>(null, Validators.required),
    installment_date: new FormControl<string>(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
      Validators.required
    ),
    agreement_status_id: new FormControl<number | string | null>(null, Validators.required),
    stage_id: new FormControl<number | string | null>(null, Validators.required),
    floor_unit_id: new FormControl<number | string | null>(null, Validators.required),
    created_by: new FormControl<number>(this.userId()),
  });

  // Computed signal for form valid state
  readonly isFormValid = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: any
  ) { }

  ngOnInit(): void {
    this.initializeData();
    this.setupFormValueChanges();

    // Manual sync for form validity signal as FormGroup.statusChanges isn't a signal by default
    this.addDemandGenerationForm.statusChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.isFormValid.set(this.addDemandGenerationForm.valid);
    });
    this.isFormValid.set(this.addDemandGenerationForm.valid);
  }

  private initializeData(): void {
    this.loading.set(true);
    this.receiptsService
      .fetchUserProjects(this.userId())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projects) => this.projects.set(projects),
        error: () => this.showError('Unable to fetch projects.'),
      });
  }

  private setupFormValueChanges(): void {
    // Project -> Wings
    this.addDemandGenerationForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.resetFields(['wing_id', 'agreement_status_id', 'stage_id', 'floor_unit_id']);
        if (projectId) this.loadWings(Number(projectId));
      });

    // Wing & Agreement Status -> Stages
    const wingControl = this.addDemandGenerationForm.get('wing_id');
    const aggStatusControl = this.addDemandGenerationForm.get('agreement_status_id');

    wingControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.handleStageFetch());
    aggStatusControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.handleStageFetch());

    // Stage -> Units
    this.addDemandGenerationForm.get('stage_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stageId) => {
        this.resetFields(['floor_unit_id']);
        if (stageId) this.handleUnitFetch();
      });
  }

  private handleStageFetch(): void {
    const projectId = this.addDemandGenerationForm.get('project_id')?.value;
    const wingId = this.addDemandGenerationForm.get('wing_id')?.value;
    const aggStatusId = this.addDemandGenerationForm.get('agreement_status_id')?.value;

    if (projectId && wingId && aggStatusId) {
      this.resetFields(['stage_id', 'floor_unit_id']);
      this.fetchStages(Number(projectId), Number(wingId), Number(aggStatusId));
    } else {
      this.stages.set([]);
    }
  }

  private handleUnitFetch(): void {
    const projectId = this.addDemandGenerationForm.get('project_id')?.value;
    const wingId = this.addDemandGenerationForm.get('wing_id')?.value;
    const aggStatusId = this.addDemandGenerationForm.get('agreement_status_id')?.value;
    const stageId = this.addDemandGenerationForm.get('stage_id')?.value;

    if (projectId && wingId && aggStatusId && stageId) {
      this.fetchUnits(Number(projectId), Number(wingId), Number(aggStatusId), Number(stageId));
    } else {
      this.units.set([]);
    }
  }

  private resetFields(fields: string[]): void {
    const patch: any = {};
    fields.forEach(f => patch[f] = null);
    this.addDemandGenerationForm.patchValue(patch, { emitEvent: false });

    if (fields.includes('wing_id')) this.wings.set([]);
    if (fields.includes('stage_id')) this.stages.set([]);
    if (fields.includes('floor_unit_id')) this.units.set([]);
  }

  private loadWings(projectId: number): void {
    this.receiptsService
      .fetchWings(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wings) => this.wings.set(wings),
        error: () => this.showError('No wings available.'),
      });
  }

  private fetchStages(projectId: number, wingId: number, agreementStatusId: number): void {
    this.loading.set(true);
    this.http
      .post<{ data: PaymentStage[] }>(`${this.baseUrl}/fetch_payment_stage`, {
        project_id: projectId,
        wing_id: wingId,
        status_id: 1,
        agreement_status_id: agreementStatusId,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          let stages = res.data || [];
          if (agreementStatusId === 2 && stages.length > 0) {
            const firstStage = stages[0];
            stages = [firstStage];
            this.addDemandGenerationForm.patchValue({ stage_id: firstStage.payment_stage_id }, { emitEvent: true });
          }
          this.stages.set(stages);
        },
        error: () => this.stages.set([]),
      });
  }

  private fetchUnits(projectId: number, wingId: number, agreementStatusId: number, stageId: number): void {
    this.loading.set(true);
    this.receiptsService
      .fetchUnitsWithAgreementStatus(projectId, wingId, agreementStatusId, stageId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const units = (response.data || []).map((item: Unit) => ({
            ...item,
            full_name: `${item.floor_unit} - ${item.applicant_name}`,
          }));
          this.units.set(units);
        },
        error: () => this.showError('Units not Available.'),
      });
  }

  addDemand(): void {
    if (this.addDemandGenerationForm.invalid) {
      this.showError('Please fill all required fields');
      this.addDemandGenerationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.http
      .post<{ message?: string }>(`${this.baseUrl}/add_demand`, {
        ...this.addDemandGenerationForm.value,
        created_by: this.userId()
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.addDemandGenerationForm.reset({
            created_by: this.userId(),
            installment_date: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
          });
          this.dialog.open(SuccessDialogComponent, {
            data: { message: res.message || 'Demand generated successfully' },
          });
          this.dialogRef.close(true);
        },
        error: (error) => this.showError(error.error?.message || 'Failed to create demand.'),
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}