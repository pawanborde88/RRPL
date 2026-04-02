import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddIncentiveSlabsDialogComponent } from './add-incentive-slabs-dialog.component';

describe('AddIncentiveSlabsDialogComponent', () => {
  let component: AddIncentiveSlabsDialogComponent;
  let fixture: ComponentFixture<AddIncentiveSlabsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddIncentiveSlabsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddIncentiveSlabsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
