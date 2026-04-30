import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalAminities } from './global-aminities';

describe('GlobalAminities', () => {
  let component: GlobalAminities;
  let fixture: ComponentFixture<GlobalAminities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalAminities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalAminities);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
