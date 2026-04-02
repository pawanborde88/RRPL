import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUnitNocComponent } from './add-unit-noc.component';

describe('AddUnitNocComponent', () => {
  let component: AddUnitNocComponent;
  let fixture: ComponentFixture<AddUnitNocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUnitNocComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUnitNocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
