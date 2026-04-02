import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddhUpcomingEventsComponent } from './addh-upcoming-events.component';

describe('AddhUpcomingEventsComponent', () => {
  let component: AddhUpcomingEventsComponent;
  let fixture: ComponentFixture<AddhUpcomingEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddhUpcomingEventsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddhUpcomingEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
