import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingDetailsChartComponent } from './booking-details-chart.component';

describe('BookingDetailsChartComponent', () => {
  let component: BookingDetailsChartComponent;
  let fixture: ComponentFixture<BookingDetailsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingDetailsChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingDetailsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
