import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendMeetingDialogComponent } from './attend-meeting-dialog.component';

describe('AttendMeetingDialogComponent', () => {
  let component: AttendMeetingDialogComponent;
  let fixture: ComponentFixture<AttendMeetingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendMeetingDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendMeetingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
