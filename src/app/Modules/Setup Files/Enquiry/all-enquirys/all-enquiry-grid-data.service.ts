import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AgGridDataService } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/services/ag-grid-data.service';
import { AllEnquiryStore } from './all-enquirys.store';

@Injectable()
export class AllEnquiryGridDataService extends AgGridDataService {
  private readonly enquiryStore = inject(AllEnquiryStore);

  override fetchData(
    endpoint: string,
    method: 'GET' | 'POST',
    payload: Record<string, unknown>,
    retryCount: number = 2
  ): Observable<unknown> {
    // Suspend API calls for the main enquiries endpoint until authorized (manual filter or history context)
    if (endpoint === 'fetch_project_enquiries' && !this.enquiryStore.isLoadAuthorized()) {
      return of({ rowData: [], totalCount: 0 });
    }

    return super.fetchData(endpoint, method, payload, retryCount);
  }
}
