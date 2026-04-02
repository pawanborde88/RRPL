import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllConfigurationComponent } from './all-configuration.component';

describe('AllConfigurationComponent', () => {
  let component: AllConfigurationComponent;
  let fixture: ComponentFixture<AllConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllConfigurationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
