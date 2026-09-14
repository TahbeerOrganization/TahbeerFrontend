import { Component, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  @Input() activePage: string = 'dashboard';

  isOpen = signal(false);

  constructor(
    public auth: AuthService
  ) {}

  toggle(): void {
    this.isOpen.update(value => !value);
  }

  close(): void {
    this.isOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}