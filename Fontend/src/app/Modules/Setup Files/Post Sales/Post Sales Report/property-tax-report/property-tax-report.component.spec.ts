import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyTaxReportComponent } from './property-tax-report.component';

describe('PropertyTaxReportComponent', () => {
  let component: PropertyTaxReportComponent;
  let fixture: ComponentFixture<PropertyTaxReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyTaxReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PropertyTaxReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
