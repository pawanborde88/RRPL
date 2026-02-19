import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBrokerageSlabsComponent } from './add-brokerage-slabs.component';

describe('AddBrokerageSlabsComponent', () => {
  let component: AddBrokerageSlabsComponent;
  let fixture: ComponentFixture<AddBrokerageSlabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBrokerageSlabsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddBrokerageSlabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
