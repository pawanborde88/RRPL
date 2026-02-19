import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewMomMeetingDialogComponent } from './add-new-mom-meeting-dialog.component';

describe('AddNewMomMeetingDialogComponent', () => {
  let component: AddNewMomMeetingDialogComponent;
  let fixture: ComponentFixture<AddNewMomMeetingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewMomMeetingDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddNewMomMeetingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
