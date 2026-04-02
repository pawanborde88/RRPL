import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPaymentstageDialogComponent } from './edit-paymentstage-dialog.component';

describe('EditPaymentstageDialogComponent', () => {
  let component: EditPaymentstageDialogComponent;
  let fixture: ComponentFixture<EditPaymentstageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPaymentstageDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditPaymentstageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
