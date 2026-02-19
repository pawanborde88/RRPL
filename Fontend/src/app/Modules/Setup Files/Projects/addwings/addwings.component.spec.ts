import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddwingsComponent } from './addwings.component';

describe('AddwingsComponent', () => {
  let component: AddwingsComponent;
  let fixture: ComponentFixture<AddwingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddwingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddwingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
