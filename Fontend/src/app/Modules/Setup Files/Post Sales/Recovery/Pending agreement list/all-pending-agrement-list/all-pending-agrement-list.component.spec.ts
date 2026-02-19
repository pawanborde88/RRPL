import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPendingAgrementListComponent } from './all-pending-agrement-list.component';

describe('AllPendingAgrementListComponent', () => {
  let component: AllPendingAgrementListComponent;
  let fixture: ComponentFixture<AllPendingAgrementListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPendingAgrementListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllPendingAgrementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
