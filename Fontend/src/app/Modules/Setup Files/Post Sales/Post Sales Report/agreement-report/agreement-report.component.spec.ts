import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementReportComponent } from './agreement-report.component';

describe('AgreementReportComponent', () => {
  let component: AgreementReportComponent;
  let fixture: ComponentFixture<AgreementReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgreementReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgreementReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
