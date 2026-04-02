import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportLeadsuccessHistoryComponent } from './import-leadsuccess-history.component';

describe('ImportLeadsuccessHistoryComponent', () => {
  let component: ImportLeadsuccessHistoryComponent;
  let fixture: ComponentFixture<ImportLeadsuccessHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportLeadsuccessHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportLeadsuccessHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
