import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditAnnualCommitmentdialog } from './add-edit-annual-commitmentdialog';

describe('AddEditAnnualCommitmentdialog', () => {
  let component: AddEditAnnualCommitmentdialog;
  let fixture: ComponentFixture<AddEditAnnualCommitmentdialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditAnnualCommitmentdialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditAnnualCommitmentdialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
