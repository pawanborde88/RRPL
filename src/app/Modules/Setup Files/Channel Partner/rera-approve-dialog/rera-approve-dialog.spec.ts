import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReraApproveDialog } from './rera-approve-dialog';

describe('ReraApproveDialog', () => {
  let component: ReraApproveDialog;
  let fixture: ComponentFixture<ReraApproveDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReraApproveDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReraApproveDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
