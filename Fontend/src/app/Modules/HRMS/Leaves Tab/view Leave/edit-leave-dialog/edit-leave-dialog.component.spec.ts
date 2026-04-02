import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLeaveDialogComponent } from './edit-leave-dialog.component';

describe('EditLeaveDialogComponent', () => {
  let component: EditLeaveDialogComponent;
  let fixture: ComponentFixture<EditLeaveDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLeaveDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditLeaveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
