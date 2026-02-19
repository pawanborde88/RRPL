import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchUpcomingEventsComponent } from './fetch-upcoming-events.component';

describe('FetchUpcomingEventsComponent', () => {
  let component: FetchUpcomingEventsComponent;
  let fixture: ComponentFixture<FetchUpcomingEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchUpcomingEventsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchUpcomingEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
