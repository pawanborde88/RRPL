import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDissmissLeadsReportComponent } from './all-dissmiss-leads-report.component';

describe('AllDissmissLeadsReportComponent', () => {
  let component: AllDissmissLeadsReportComponent;
  let fixture: ComponentFixture<AllDissmissLeadsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDissmissLeadsReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllDissmissLeadsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
