import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllNearbyLocations } from './all-nearby-locations';

describe('AllNearbyLocations', () => {
  let component: AllNearbyLocations;
  let fixture: ComponentFixture<AllNearbyLocations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllNearbyLocations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllNearbyLocations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
