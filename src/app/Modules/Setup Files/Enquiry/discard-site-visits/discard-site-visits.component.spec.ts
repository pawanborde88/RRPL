import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscardSiteVisitsComponent } from './discard-site-visits.component';

describe('DiscardSiteVisitsComponent', () => {
  let component: DiscardSiteVisitsComponent;
  let fixture: ComponentFixture<DiscardSiteVisitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscardSiteVisitsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DiscardSiteVisitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
