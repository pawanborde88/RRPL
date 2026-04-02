import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptReportComponent } from './receipt-report.component';

describe('ReceiptReportComponent', () => {
  let component: ReceiptReportComponent;
  let fixture: ComponentFixture<ReceiptReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReceiptReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
