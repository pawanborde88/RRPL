import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchCustomerDataComponent } from './search-customer-data.component';

describe('SearchCustomerDataComponent', () => {
  let component: SearchCustomerDataComponent;
  let fixture: ComponentFixture<SearchCustomerDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchCustomerDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchCustomerDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
