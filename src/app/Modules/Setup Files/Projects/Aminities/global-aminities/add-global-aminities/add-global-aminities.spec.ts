import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGlobalAminities } from './add-global-aminities';

describe('AddGlobalAminities', () => {
  let component: AddGlobalAminities;
  let fixture: ComponentFixture<AddGlobalAminities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddGlobalAminities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddGlobalAminities);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
