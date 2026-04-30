import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditMontlyTargetDialog } from './add-edit-montly-target-dialog';

describe('AddEditMontlyTargetDialog', () => {
  let component: AddEditMontlyTargetDialog;
  let fixture: ComponentFixture<AddEditMontlyTargetDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditMontlyTargetDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditMontlyTargetDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
