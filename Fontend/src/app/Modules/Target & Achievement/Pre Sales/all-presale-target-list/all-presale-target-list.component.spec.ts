import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPresaleTargetListComponent } from './all-presale-target-list.component';

describe('AllPresaleTargetListComponent', () => {
  let component: AllPresaleTargetListComponent;
  let fixture: ComponentFixture<AllPresaleTargetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPresaleTargetListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllPresaleTargetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
