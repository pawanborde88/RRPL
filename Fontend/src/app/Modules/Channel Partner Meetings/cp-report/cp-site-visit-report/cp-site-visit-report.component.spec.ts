import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpSiteVisitReportComponent } from './cp-site-visit-report.component';

describe('CpSiteVisitReportComponent', () => {
  let component: CpSiteVisitReportComponent;
  let fixture: ComponentFixture<CpSiteVisitReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpSiteVisitReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CpSiteVisitReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
