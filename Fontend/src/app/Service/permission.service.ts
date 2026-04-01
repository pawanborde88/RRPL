

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }



  fetchAllModules() {
    return this.http.get(`${this.baseUrl}/fetch_modules_dropdown`);
  }
  fetchSubModules(ID:any) {
    return this.http.post(`${this.baseUrl}/fetch_child_module` , { module_id: ID});
  }
  fetchAllUsers() {
    return this.http.get(`${this.baseUrl}/users_dropdown`);
  }
  fetchAllRoles() {
    return this.http.get(`${this.baseUrl}/roles_dropdown`);
  }

  fetchAllRolePermission() {
    return this.http.get(`${this.baseUrl}/permissions_dropdown`);
  }


}
