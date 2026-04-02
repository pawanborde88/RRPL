import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgetReportComponent } from './ledget-report.component';

describe('LedgetReportComponent', () => {
  let component: LedgetReportComponent;
  let fixture: ComponentFixture<LedgetReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgetReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LedgetReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
