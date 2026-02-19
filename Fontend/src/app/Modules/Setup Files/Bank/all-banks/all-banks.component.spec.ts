import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBanksComponent } from './all-banks.component';

describe('AllBanksComponent', () => {
  let component: AllBanksComponent;
  let fixture: ComponentFixture<AllBanksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBanksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllBanksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
