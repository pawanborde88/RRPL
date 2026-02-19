import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperianceCardViewComponent } from './experiance-card-view.component';

describe('ExperianceCardViewComponent', () => {
  let component: ExperianceCardViewComponent;
  let fixture: ComponentFixture<ExperianceCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperianceCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExperianceCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
