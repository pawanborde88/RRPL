import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddInsentiveBonusMasterDialogComponent } from './add-insentive-bonus-master-dialog.component';

describe('AddInsentiveBonusMasterDialogComponent', () => {
  let component: AddInsentiveBonusMasterDialogComponent;
  let fixture: ComponentFixture<AddInsentiveBonusMasterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddInsentiveBonusMasterDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddInsentiveBonusMasterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
