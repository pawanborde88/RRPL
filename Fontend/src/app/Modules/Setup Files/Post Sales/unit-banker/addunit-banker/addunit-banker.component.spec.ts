import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddunitBankerComponent } from './addunit-banker.component';

describe('AddunitBankerComponent', () => {
  let component: AddunitBankerComponent;
  let fixture: ComponentFixture<AddunitBankerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddunitBankerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddunitBankerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
