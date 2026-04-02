import { Component, Input, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  standalone: true,
  imports: [ AngularMaterialModule, CommonModule],
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent implements OnInit {

  @Input() items!: any[];

  constructor() { }

  ngOnInit(): void {
  }

}
