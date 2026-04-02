import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDemandGeneratedListComponent } from './all-demand-generated-list.component';

describe('AllDemandGeneratedListComponent', () => {
  let component: AllDemandGeneratedListComponent;
  let fixture: ComponentFixture<AllDemandGeneratedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDemandGeneratedListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllDemandGeneratedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
