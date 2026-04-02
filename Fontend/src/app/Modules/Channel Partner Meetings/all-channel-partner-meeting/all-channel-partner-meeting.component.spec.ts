import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllChannelPartnerMeetingComponent } from './all-channel-partner-meeting.component';

describe('AllChannelPartnerMeetingComponent', () => {
  let component: AllChannelPartnerMeetingComponent;
  let fixture: ComponentFixture<AllChannelPartnerMeetingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllChannelPartnerMeetingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllChannelPartnerMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
