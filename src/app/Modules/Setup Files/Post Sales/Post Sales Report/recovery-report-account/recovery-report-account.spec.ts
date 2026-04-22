import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoveryReportAccount } from './recovery-report-account';

describe('RecoveryReportAccount', () => {
  let component: RecoveryReportAccount;
  let fixture: ComponentFixture<RecoveryReportAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoveryReportAccount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecoveryReportAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
