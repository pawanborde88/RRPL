import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMobEmailLogComponent } from './view-mob-email-log.component';

describe('ViewMobEmailLogComponent', () => {
  let component: ViewMobEmailLogComponent;
  let fixture: ComponentFixture<ViewMobEmailLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMobEmailLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewMobEmailLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
