import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCPLevelsComponent } from './all-cplevels.component';

describe('AllCPLevelsComponent', () => {
  let component: AllCPLevelsComponent;
  let fixture: ComponentFixture<AllCPLevelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCPLevelsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllCPLevelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
