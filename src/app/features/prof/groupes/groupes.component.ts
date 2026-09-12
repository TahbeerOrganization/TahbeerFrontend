import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-groupes',
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './groupes.component.html',
  styleUrl: './groupes.component.css'
})
export class GroupesComponent {

}
