import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoDataErrorMessageComponent } from './no-data-error-message.component';

describe('NoDataErrorMessageComponent', () => {
  let component: NoDataErrorMessageComponent;
  let fixture: ComponentFixture<NoDataErrorMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoDataErrorMessageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoDataErrorMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
