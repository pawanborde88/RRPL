import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCPreportComponent } from './add-cpreport.component';

describe('AddCPreportComponent', () => {
  let component: AddCPreportComponent;
  let fixture: ComponentFixture<AddCPreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCPreportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCPreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
