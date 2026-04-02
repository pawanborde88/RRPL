import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpBillApprovedListComponent } from './cp-bill-approved-list.component';

describe('CpBillApprovedListComponent', () => {
  let component: CpBillApprovedListComponent;
  let fixture: ComponentFixture<CpBillApprovedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpBillApprovedListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CpBillApprovedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
