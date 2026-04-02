import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateWorkExperienceDialogComponent } from './add-update-work-experience-dialog.component';

describe('AddUpdateWorkExperienceDialogComponent', () => {
  let component: AddUpdateWorkExperienceDialogComponent;
  let fixture: ComponentFixture<AddUpdateWorkExperienceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUpdateWorkExperienceDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUpdateWorkExperienceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
