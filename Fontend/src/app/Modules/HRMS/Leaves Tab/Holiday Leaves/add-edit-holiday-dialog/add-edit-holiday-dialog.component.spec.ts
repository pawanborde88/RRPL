import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditHolidayDialogComponent } from './add-edit-holiday-dialog.component';

describe('AddEditHolidayDialogComponent', () => {
  let component: AddEditHolidayDialogComponent;
  let fixture: ComponentFixture<AddEditHolidayDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditHolidayDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditHolidayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
