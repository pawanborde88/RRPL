import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDigitalLeadsComponent } from './all-digital-leads.component';

describe('AllDigitalLeadsComponent', () => {
  let component: AllDigitalLeadsComponent;
  let fixture: ComponentFixture<AllDigitalLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDigitalLeadsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllDigitalLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
