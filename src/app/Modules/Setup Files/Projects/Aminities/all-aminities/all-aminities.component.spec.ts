import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAminitiesComponent } from './all-aminities.component';

describe('AllAminitiesComponent', () => {
  let component: AllAminitiesComponent;
  let fixture: ComponentFixture<AllAminitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAminitiesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllAminitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
