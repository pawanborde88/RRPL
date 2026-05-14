import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChannelPartnerStore } from './channel-partner.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-assign-source-executives-dialog',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, AutocompleteReusableComponent, ReactiveFormsModule],
  templateUrl: './assign-source-executives-dialog.html',
  styleUrl: './assign-source-executives-dialog.scss',
  providers: [ChannelPartnerStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignSourceExecutivesDialog implements OnInit {
  protected readonly store = inject(ChannelPartnerStore);
  private readonly dialogRef = inject(MatDialogRef<AssignSourceExecutivesDialog>);
  private readonly data = inject<{ partners: { id: any, name: string }[] }>(MAT_DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  userId = Number(sessionStorage.getItem('session_id'));

  readonly form = new FormGroup({
    project_id: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    sales_executive_id: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
    source_executive_id: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
    created_by: new FormControl(this.userId),
  });

  ngOnInit(): void {
    this.store.setPartners(this.data.partners);
    this.store.fetchProjects();

    this.form.get('project_id')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const projectId = value ?? 0;
      if (projectId) {
        this.store.fetchSalesExecutives(projectId);
        this.store.fetchSourceExecutives([18], [projectId]);
      } else {
        this.store.patchState({ salesExecutives: [], executives: [] });
      }
    });
  }

  onAssign(): void {
    if (this.form.invalid) return;

    const { sales_executive_id, source_executive_id, project_id, created_by } = this.form.getRawValue();
    this.store.assignExecutives(sales_executive_id, source_executive_id, project_id, created_by!).subscribe({
      next: (res: any) => {
        if (res !== null) {
          this.dialogRef.close(true);
        }
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
