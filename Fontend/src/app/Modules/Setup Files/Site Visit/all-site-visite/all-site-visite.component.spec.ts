import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSiteVisiteComponent } from './all-site-visite.component';

describe('AllSiteVisiteComponent', () => {
  let component: AllSiteVisiteComponent;
  let fixture: ComponentFixture<AllSiteVisiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSiteVisiteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSiteVisiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
