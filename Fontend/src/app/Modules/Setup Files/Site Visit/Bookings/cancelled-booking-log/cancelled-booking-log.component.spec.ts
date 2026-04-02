import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelledBookingLogComponent } from './cancelled-booking-log.component';

describe('CancelledBookingLogComponent', () => {
  let component: CancelledBookingLogComponent;
  let fixture: ComponentFixture<CancelledBookingLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelledBookingLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CancelledBookingLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
