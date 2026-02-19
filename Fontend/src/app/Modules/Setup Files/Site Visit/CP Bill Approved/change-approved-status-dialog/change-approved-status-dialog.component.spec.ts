import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeApprovedStatusDialogComponent } from './change-approved-status-dialog.component';

describe('ChangeApprovedStatusDialogComponent', () => {
  let component: ChangeApprovedStatusDialogComponent;
  let fixture: ComponentFixture<ChangeApprovedStatusDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeApprovedStatusDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangeApprovedStatusDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
