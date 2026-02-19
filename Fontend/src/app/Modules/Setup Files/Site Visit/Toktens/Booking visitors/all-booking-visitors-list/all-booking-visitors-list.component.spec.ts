import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBookingVisitorsListComponent } from './all-booking-visitors-list.component';

describe('AllBookingVisitorsListComponent', () => {
  let component: AllBookingVisitorsListComponent;
  let fixture: ComponentFixture<AllBookingVisitorsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBookingVisitorsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllBookingVisitorsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
