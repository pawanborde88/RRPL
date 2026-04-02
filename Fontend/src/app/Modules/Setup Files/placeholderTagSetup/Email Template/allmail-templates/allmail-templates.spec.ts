import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllmailTemplates } from './allmail-templates';

describe('AllmailTemplates', () => {
  let component: AllmailTemplates;
  let fixture: ComponentFixture<AllmailTemplates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllmailTemplates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllmailTemplates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
