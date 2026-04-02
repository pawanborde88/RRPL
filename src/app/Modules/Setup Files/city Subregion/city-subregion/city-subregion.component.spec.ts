import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitySubregionComponent } from './city-subregion.component';

describe('CitySubregionComponent', () => {
  let component: CitySubregionComponent;
  let fixture: ComponentFixture<CitySubregionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitySubregionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CitySubregionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
