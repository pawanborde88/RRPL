import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddbookingBillComponent } from './addbooking-bill.component';

describe('AddbookingBillComponent', () => {
  let component: AddbookingBillComponent;
  let fixture: ComponentFixture<AddbookingBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddbookingBillComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddbookingBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
