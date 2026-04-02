import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllParkingUnitListComponent } from './all-parking-unit-list.component';

describe('AllParkingUnitListComponent', () => {
  let component: AllParkingUnitListComponent;
  let fixture: ComponentFixture<AllParkingUnitListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllParkingUnitListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllParkingUnitListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
