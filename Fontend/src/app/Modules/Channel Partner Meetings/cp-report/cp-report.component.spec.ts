import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpReportComponent } from './cp-report.component';

describe('CpReportComponent', () => {
  let component: CpReportComponent;
  let fixture: ComponentFixture<CpReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CpReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
