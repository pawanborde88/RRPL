import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCPLevelsComponent } from './add-cplevels.component';

describe('AddCPLevelsComponent', () => {
  let component: AddCPLevelsComponent;
  let fixture: ComponentFixture<AddCPLevelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCPLevelsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCPLevelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
