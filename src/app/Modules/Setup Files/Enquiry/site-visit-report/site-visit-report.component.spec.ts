import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteVisitReportComponent } from './site-visit-report.component';

describe('SiteVisitReportComponent', () => {
  let component: SiteVisitReportComponent;
  let fixture: ComponentFixture<SiteVisitReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteVisitReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SiteVisitReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
