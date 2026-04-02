import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTokenTypesComponent } from './all-token-types.component';

describe('AllTokenTypesComponent', () => {
  let component: AllTokenTypesComponent;
  let fixture: ComponentFixture<AllTokenTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTokenTypesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllTokenTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
