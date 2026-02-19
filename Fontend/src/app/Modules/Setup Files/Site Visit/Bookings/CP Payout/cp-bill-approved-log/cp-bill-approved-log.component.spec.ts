import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpBillApprovedLogComponent } from './cp-bill-approved-log.component';

describe('CpBillApprovedLogComponent', () => {
  let component: CpBillApprovedLogComponent;
  let fixture: ComponentFixture<CpBillApprovedLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpBillApprovedLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CpBillApprovedLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
