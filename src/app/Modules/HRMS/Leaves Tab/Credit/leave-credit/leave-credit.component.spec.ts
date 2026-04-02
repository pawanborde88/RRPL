import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveCreditComponent } from './leave-credit.component';

describe('LeaveCreditComponent', () => {
  let component: LeaveCreditComponent;
  let fixture: ComponentFixture<LeaveCreditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveCreditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeaveCreditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
