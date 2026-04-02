import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelTokenDialogComponent } from './cancel-token-dialog.component';

describe('CancelTokenDialogComponent', () => {
  let component: CancelTokenDialogComponent;
  let fixture: ComponentFixture<CancelTokenDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelTokenDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CancelTokenDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
