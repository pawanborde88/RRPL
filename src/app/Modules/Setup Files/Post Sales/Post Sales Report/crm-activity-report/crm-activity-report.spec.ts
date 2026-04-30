import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrmActivityReport } from './crm-activity-report';

describe('CrmActivityReport', () => {
  let component: CrmActivityReport;
  let fixture: ComponentFixture<CrmActivityReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmActivityReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrmActivityReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
