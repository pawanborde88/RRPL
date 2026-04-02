import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatAppChattingDialogComponent } from './what-app-chatting-dialog.component';

describe('WhatAppChattingDialogComponent', () => {
  let component: WhatAppChattingDialogComponent;
  let fixture: ComponentFixture<WhatAppChattingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatAppChattingDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WhatAppChattingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
