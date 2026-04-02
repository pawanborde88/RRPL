import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingInventoryChartComponent } from './parking-inventory-chart.component';

describe('ParkingInventoryChartComponent', () => {
  let component: ParkingInventoryChartComponent;
  let fixture: ComponentFixture<ParkingInventoryChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingInventoryChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParkingInventoryChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
