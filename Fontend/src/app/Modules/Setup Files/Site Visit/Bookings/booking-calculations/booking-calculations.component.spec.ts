import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingCalculationsComponent } from './booking-calculations.component';

describe('BookingCalculationsComponent', () => {
  let component: BookingCalculationsComponent;
  let fixture: ComponentFixture<BookingCalculationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCalculationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingCalculationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
