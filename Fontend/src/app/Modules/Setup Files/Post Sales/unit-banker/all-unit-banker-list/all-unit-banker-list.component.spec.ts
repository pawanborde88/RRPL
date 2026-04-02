import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllUnitBankerListComponent } from './all-unit-banker-list.component';

describe('AllUnitBankerListComponent', () => {
  let component: AllUnitBankerListComponent;
  let fixture: ComponentFixture<AllUnitBankerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllUnitBankerListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllUnitBankerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
