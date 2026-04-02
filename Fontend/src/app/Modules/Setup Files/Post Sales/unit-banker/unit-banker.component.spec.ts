import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitBankerComponent } from './unit-banker.component';

describe('UnitBankerComponent', () => {
  let component: UnitBankerComponent;
  let fixture: ComponentFixture<UnitBankerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitBankerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitBankerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
