import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllReceiptsDialogComponent } from './all-receipts-dialog.component';

describe('AllReceiptsDialogComponent', () => {
  let component: AllReceiptsDialogComponent;
  let fixture: ComponentFixture<AllReceiptsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllReceiptsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllReceiptsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
