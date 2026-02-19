import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillCardViewComponent } from './skill-card-view.component';

describe('SkillCardViewComponent', () => {
  let component: SkillCardViewComponent;
  let fixture: ComponentFixture<SkillCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SkillCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
