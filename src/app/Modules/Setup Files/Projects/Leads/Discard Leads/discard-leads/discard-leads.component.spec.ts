import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscardLeadsComponent } from './discard-leads.component';

describe('DiscardLeadsComponent', () => {
  let component: DiscardLeadsComponent;
  let fixture: ComponentFixture<DiscardLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscardLeadsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DiscardLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
