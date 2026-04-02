import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInsentiveSlabsComponent } from './all-insentive-slabs.component';

describe('AllInsentiveSlabsComponent', () => {
  let component: AllInsentiveSlabsComponent;
  let fixture: ComponentFixture<AllInsentiveSlabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllInsentiveSlabsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllInsentiveSlabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
