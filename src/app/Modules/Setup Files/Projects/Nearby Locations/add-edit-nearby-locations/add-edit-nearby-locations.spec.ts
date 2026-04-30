import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditNearbyLocations } from './add-edit-nearby-locations';

describe('AddEditNearbyLocations', () => {
  let component: AddEditNearbyLocations;
  let fixture: ComponentFixture<AddEditNearbyLocations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditNearbyLocations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditNearbyLocations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
