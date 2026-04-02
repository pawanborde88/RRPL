import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRAttendenceScannerComponent } from './qrattendence-scanner.component';

describe('QRAttendenceScannerComponent', () => {
  let component: QRAttendenceScannerComponent;
  let fixture: ComponentFixture<QRAttendenceScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRAttendenceScannerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QRAttendenceScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
