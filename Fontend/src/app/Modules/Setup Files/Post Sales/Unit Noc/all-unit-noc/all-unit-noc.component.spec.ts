import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllUnitNocComponent } from './all-unit-noc.component';

describe('AllUnitNocComponent', () => {
  let component: AllUnitNocComponent;
  let fixture: ComponentFixture<AllUnitNocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllUnitNocComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllUnitNocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
