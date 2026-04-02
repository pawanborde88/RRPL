import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressCardViewComponent } from './address-card-view.component';

describe('AddressCardViewComponent', () => {
  let component: AddressCardViewComponent;
  let fixture: ComponentFixture<AddressCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddressCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
