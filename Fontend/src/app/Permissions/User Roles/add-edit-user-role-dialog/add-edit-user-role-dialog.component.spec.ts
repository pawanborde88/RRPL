import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddEditUserRoleDialogComponent, AddEditUserRoleDialogData } from './add-edit-user-role-dialog.component';

describe('AddEditUserRoleDialogComponent', () => {
  let component: AddEditUserRoleDialogComponent;
  let fixture: ComponentFixture<AddEditUserRoleDialogComponent>;
  const data: AddEditUserRoleDialogData = { mode: 'add' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditUserRoleDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditUserRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
