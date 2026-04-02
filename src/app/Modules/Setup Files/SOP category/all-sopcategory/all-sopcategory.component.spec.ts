import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSOPCategoryComponent } from './all-sopcategory.component';

describe('AllSOPCategoryComponent', () => {
  let component: AllSOPCategoryComponent;
  let fixture: ComponentFixture<AllSOPCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSOPCategoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSOPCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
