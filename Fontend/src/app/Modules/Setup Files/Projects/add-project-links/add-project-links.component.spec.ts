import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProjectLinksComponent } from './add-project-links.component';

describe('AddProjectLinksComponent', () => {
  let component: AddProjectLinksComponent;
  let fixture: ComponentFixture<AddProjectLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProjectLinksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddProjectLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
