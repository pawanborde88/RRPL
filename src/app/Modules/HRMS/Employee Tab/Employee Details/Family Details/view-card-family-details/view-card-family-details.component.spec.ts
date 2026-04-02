import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCardFamilyDetailsComponent } from './view-card-family-details.component';

describe('ViewCardFamilyDetailsComponent', () => {
  let component: ViewCardFamilyDetailsComponent;
  let fixture: ComponentFixture<ViewCardFamilyDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewCardFamilyDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewCardFamilyDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
