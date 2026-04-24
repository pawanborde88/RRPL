import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MSEBDetailsReportComponent } from './msebdetails-report.component';

describe('MSEBDetailsReportComponent', () => {
  let component: MSEBDetailsReportComponent;
  let fixture: ComponentFixture<MSEBDetailsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MSEBDetailsReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MSEBDetailsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
