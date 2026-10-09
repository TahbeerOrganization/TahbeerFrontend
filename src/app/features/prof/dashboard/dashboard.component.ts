
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // Statistiques
  totalEtudiants = signal(0);
  totalGroupes = signal(0);
  totalProgrammes = signal(0);
  presenceAujourdhui = signal(0);

  // Données
  etudiants = signal<any[]>([]);
  groupes = signal<any[]>([]);
  programmes = signal<any[]>([]);
  presencesAujourdhui = signal<any[]>([]);
  alertesGiaab = signal<any[]>([]);

  // État
  loading = signal(true);
  errorMsg = signal('');
  activeMenu = signal('dashboard');

  constructor(
    public auth: AuthService,
    private sb: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await Promise.all([
        this.loadEtudiants(),
        this.loadGroupes(),
        this.loadProgrammes(),
        this.loadPresences(),
        this.loadAbsences()
      ]);
    } catch (error: any) {
      console.error('Erreur Dashboard:', error);

      this.errorMsg.set(
        error?.message || 'خطأ في تحميل لوحة التحكم'
      );
    } finally {
      this.loading.set(false);
    }
  }

  // 1. Charger les étudiants
  async loadEtudiants(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('profiles')
      .select('id, nom, role, groupe_id, niveau, created_at')
      .eq('role', 'etudiant')
      .order('nom');

    if (error) {
      console.error('Erreur étudiants:', error);
      throw error;
    }

    const liste = data ?? [];

    this.etudiants.set(liste);
    this.totalEtudiants.set(liste.length);
  }

  // 2. Charger les groupes
  async loadGroupes(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('groupes')
      .select('*');

    if (error) {
      console.error('Erreur groupes:', error);
      throw error;
    }

    const liste = data ?? [];

    this.groupes.set(liste);
    this.totalGroupes.set(liste.length);

    console.log('Groupes:', liste);
    console.log('Total groupes:', liste.length);
  }

  // 3. Charger les programmes
  async loadProgrammes(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('programmes')
      .select('*');

    if (error) {
      console.error('Erreur programmes:', error);
      throw error;
    }

    const liste = data ?? [];

    this.programmes.set(liste);
    this.totalProgrammes.set(liste.length);

    console.log('Programmes:', liste);
    console.log('Total programmes:', liste.length);
  }

  // 4. Charger les présences d'aujourd'hui
  async loadPresences(): Promise<void> {
    const today = new Date()
      .toISOString()
      .split('T')[0];

    const { data, error } = await this.sb.client
      .from('presences')
      .select('*, profiles(nom, groupe_id)')
      .eq('date', today);

    if (error) {
      console.error('Erreur présences:', error);
      this.presencesAujourdhui.set([]);
      this.presenceAujourdhui.set(0);
      return;
    }

    const liste = data ?? [];

    this.presencesAujourdhui.set(liste);

    this.presenceAujourdhui.set(
      liste.filter((p: any) => p.statut === 'حاضر').length
    );
  }

  // 5. Charger les alertes d'absence
  async loadAbsences(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('presences')
      .select(`
        etudiant_id,
        statut,
        profiles(nom)
      `)
      .eq('statut', 'غائب');

    if (error) {
      console.error('Erreur absences:', error);
      this.alertesGiaab.set([]);
      return;
    }

    const counts: Record<string, any> = {};

    (data ?? []).forEach((p: any) => {
      if (!p.etudiant_id) {
        return;
      }

      if (!counts[p.etudiant_id]) {
        counts[p.etudiant_id] = {
          id: p.etudiant_id,
          nom: p.profiles?.nom || 'طالب',
          count: 0
        };
      }

      counts[p.etudiant_id].count++;
    });

    const alertes = Object.values(counts)
      .filter((x: any) => x.count >= 2)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    this.alertesGiaab.set(alertes);
  }

  // Taux de présence
  getTauxPresence(): number {
    const total = this.totalEtudiants();

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (this.presenceAujourdhui() / total) * 100
    );
  }


  // Badge du niveau
  getNiveauBadge(niveau?: string): string {
    switch (niveau) {
      case 'مبتدئ':
        return 'badge-green';

      case 'متوسط':
        return 'badge-blue';

      case 'متقدم':
        return 'badge-purple';

      default:
        return 'badge-gray';
    }
  }

  // Navigation
  navigateTo(path: string): void {
    this.activeMenu.set(path);
    this.router.navigate(['/prof', path]);
  }

  // Déconnexion
  async logout(): Promise<void> {
    await this.auth.logout();
  }

  // Date d'aujourd'hui
  today(): string {
    return new Date().toLocaleDateString('ar-MA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}