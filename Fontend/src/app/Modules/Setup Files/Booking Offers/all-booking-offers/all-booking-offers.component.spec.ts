import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBookingOffersComponent } from './all-booking-offers.component';

describe('AllBookingOffersComponent', () => {
  let component: AllBookingOffersComponent;
  let fixture: ComponentFixture<AllBookingOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBookingOffersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllBookingOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
