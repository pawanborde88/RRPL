import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBugetsComponent } from './all-bugets.component';

describe('AllBugetsComponent', () => {
  let component: AllBugetsComponent;
  let fixture: ComponentFixture<AllBugetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBugetsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllBugetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
