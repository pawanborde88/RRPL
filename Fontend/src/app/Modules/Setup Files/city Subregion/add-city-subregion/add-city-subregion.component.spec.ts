import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCitySubregionComponent } from './add-city-subregion.component';

describe('AddCitySubregionComponent', () => {
  let component: AddCitySubregionComponent;
  let fixture: ComponentFixture<AddCitySubregionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCitySubregionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCitySubregionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
