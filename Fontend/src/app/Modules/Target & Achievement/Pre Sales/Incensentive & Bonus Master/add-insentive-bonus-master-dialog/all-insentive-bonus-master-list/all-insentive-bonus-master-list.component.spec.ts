import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInsentiveBonusMasterListComponent } from './all-insentive-bonus-master-list.component';

describe('AllInsentiveBonusMasterListComponent', () => {
  let component: AllInsentiveBonusMasterListComponent;
  let fixture: ComponentFixture<AllInsentiveBonusMasterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllInsentiveBonusMasterListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllInsentiveBonusMasterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
