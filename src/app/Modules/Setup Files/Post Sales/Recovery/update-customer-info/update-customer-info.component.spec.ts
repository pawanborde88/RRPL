import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateCustomerInfoComponent } from './update-customer-info.component';

describe('UpdateCustomerInfoComponent', () => {
  let component: UpdateCustomerInfoComponent;
  let fixture: ComponentFixture<UpdateCustomerInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateCustomerInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateCustomerInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
