import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDealValueComponent } from './add-deal-value.component';

describe('AddDealValueComponent', () => {
  let component: AddDealValueComponent;
  let fixture: ComponentFixture<AddDealValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDealValueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddDealValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
