import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpExecutiveFollowUpReport } from './cp-executive-follow-up-report';

describe('CpExecutiveFollowUpReport', () => {
  let component: CpExecutiveFollowUpReport;
  let fixture: ComponentFixture<CpExecutiveFollowUpReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpExecutiveFollowUpReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CpExecutiveFollowUpReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
