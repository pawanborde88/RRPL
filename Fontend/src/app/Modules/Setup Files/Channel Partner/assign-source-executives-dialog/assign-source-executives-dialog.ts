import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChannelPartnerStore } from './channel-partner.store';

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
  userId = Number(sessionStorage.getItem('session_id'));

  readonly form = new FormGroup({
    project_id: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
    source_executive_id: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
    created_by: new FormControl(this.userId),
  });

  ngOnInit(): void {
    this.store.setPartners(this.data.partners);
    this.store.fetchSalesExecutives([18]);
    this.store.fetchProjects();
  }

  onAssign(): void {
    if (this.form.invalid) return;

    const { source_executive_id, project_id, created_by } = this.form.getRawValue();
    this.store.assignExecutives(source_executive_id, project_id, created_by!);

    this.dialogRef.close(true);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
