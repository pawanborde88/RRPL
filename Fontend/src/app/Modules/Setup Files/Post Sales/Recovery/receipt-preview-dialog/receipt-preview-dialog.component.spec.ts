import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptPreviewDialogComponent } from './receipt-preview-dialog.component';

describe('ReceiptPreviewDialogComponent', () => {
  let component: ReceiptPreviewDialogComponent;
  let fixture: ComponentFixture<ReceiptPreviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptPreviewDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReceiptPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
