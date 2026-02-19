import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateEducationDialogComponent } from './add-update-education-dialog.component';

describe('AddUpdateEducationDialogComponent', () => {
  let component: AddUpdateEducationDialogComponent;
  let fixture: ComponentFixture<AddUpdateEducationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUpdateEducationDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUpdateEducationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
