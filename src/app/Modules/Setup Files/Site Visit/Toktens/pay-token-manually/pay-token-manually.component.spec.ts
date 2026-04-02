import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayTokenManuallyComponent } from './pay-token-manually.component';

describe('PayTokenManuallyComponent', () => {
  let component: PayTokenManuallyComponent;
  let fixture: ComponentFixture<PayTokenManuallyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayTokenManuallyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PayTokenManuallyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
