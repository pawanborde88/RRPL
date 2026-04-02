import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreSalesReportComponent } from './pre-sales-report.component';

describe('PreSalesReportComponent', () => {
  let component: PreSalesReportComponent;
  let fixture: ComponentFixture<PreSalesReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreSalesReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreSalesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
