import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPresalesTargetDialogComponent } from './add-presales-target-dialog.component';

describe('AddPresalesTargetDialogComponent', () => {
  let component: AddPresalesTargetDialogComponent;
  let fixture: ComponentFixture<AddPresalesTargetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPresalesTargetDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddPresalesTargetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
