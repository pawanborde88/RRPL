import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChekqueStatusDialogComponent } from './chekque-status-dialog.component';

describe('ChekqueStatusDialogComponent', () => {
  let component: ChekqueStatusDialogComponent;
  let fixture: ComponentFixture<ChekqueStatusDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChekqueStatusDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChekqueStatusDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
