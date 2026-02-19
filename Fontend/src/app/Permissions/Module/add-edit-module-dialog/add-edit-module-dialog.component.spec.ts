import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddEditModuleDialogComponent } from './add-edit-module-dialog.component';

describe('AddEditModuleDialogComponent', () => {
  let component: AddEditModuleDialogComponent;
  let fixture: ComponentFixture<AddEditModuleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditModuleDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditModuleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
