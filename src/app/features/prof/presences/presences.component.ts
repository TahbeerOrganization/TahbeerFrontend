import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-presences',
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './presences.component.html',
  styleUrl: './presences.component.css'
})
export class PresencesComponent {

}
