import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProjectsComponent } from './edit-projects.component';

describe('EditProjectsComponent', () => {
  let component: EditProjectsComponent;
  let fixture: ComponentFixture<EditProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProjectsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
