import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimedLeadsComponent } from './claimed-leads.component';

describe('ClaimedLeadsComponent', () => {
  let component: ClaimedLeadsComponent;
  let fixture: ComponentFixture<ClaimedLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimedLeadsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClaimedLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
