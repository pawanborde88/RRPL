import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../angular-material.module';

@Component({
  selector: 'app-main-permission',
  standalone: true,
  imports: [AngularMaterialModule, RouterModule, CommonModule],
  templateUrl: './main-permission.component.html',
  styleUrl: './main-permission.component.scss'
})
export class MainPermissionComponent {
  @Output() chipClicked = new EventEmitter<{ index: number; route: string }>();

  activeIndex = signal(0);

  subItems: any[] = [
    {
      route: '/module',
      label: 'Modules',
    },
    {
      route: '/roles',
      label: 'Roles',
    },
    {
      route: '/permission',
      label: 'Permissions',
    },
    {
      route: '/user-role',
      label: 'User Roles',
    },
    {
      route: '/role-permission',
      label: 'Role Permissions',
    },
    {
      route: '/permission-access',
      label: 'Permission Access',
    },
  ];

  constructor(private router: Router) {}

  onChipClick(index: number) {
    this.activeIndex.set(index);
    const route = this.subItems[index]?.route;
    if (route) {
      this.chipClicked.emit({ index, route });
      // Optionally navigate here if needed
      // this.router.navigate([route]);
    }
  }

  // Optional: Initialize activeIndex based on current route
  ngOnInit() {
    const currentRoute = this.router.url;
    const foundIndex = this.subItems.findIndex(item => item.route === currentRoute);
    if (foundIndex >= 0) {
      this.activeIndex.set(foundIndex);
    }
  }

}
