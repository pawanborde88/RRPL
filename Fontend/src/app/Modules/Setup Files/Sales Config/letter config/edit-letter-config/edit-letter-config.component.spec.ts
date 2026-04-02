import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLetterConfigComponent } from './edit-letter-config.component';

describe('EditLetterConfigComponent', () => {
  let component: EditLetterConfigComponent;
  let fixture: ComponentFixture<EditLetterConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLetterConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditLetterConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
