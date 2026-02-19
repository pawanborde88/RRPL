import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalLevelDialogComponent } from './approval-level-dialog.component';

describe('ApprovalLevelDialogComponent', () => {
  let component: ApprovalLevelDialogComponent;
  let fixture: ComponentFixture<ApprovalLevelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalLevelDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApprovalLevelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
