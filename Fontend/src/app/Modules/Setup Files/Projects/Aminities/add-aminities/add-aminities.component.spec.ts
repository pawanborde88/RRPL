import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAminitiesComponent } from './add-aminities.component';

describe('AddAminitiesComponent', () => {
  let component: AddAminitiesComponent;
  let fixture: ComponentFixture<AddAminitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAminitiesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddAminitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
