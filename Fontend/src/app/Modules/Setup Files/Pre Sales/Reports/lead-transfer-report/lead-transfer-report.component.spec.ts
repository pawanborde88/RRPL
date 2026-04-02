import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadTransferReportComponent } from './lead-transfer-report.component';

describe('LeadTransferReportComponent', () => {
  let component: LeadTransferReportComponent;
  let fixture: ComponentFixture<LeadTransferReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadTransferReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeadTransferReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
