import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  

  // ── Stats KPI ──────────────────────────────────
  totalEtudiants = signal(0);
  presenceAujourdhui = signal(0);
  souratesMktmla = signal(0);
  devoirsEnAttente = signal(0);

  // ── Données tableaux ───────────────────────────
  etudiants = signal<any[]>([]);
  presencesAujourdhui = signal<any[]>([]);
  devoirsRecents = signal<any[]>([]);
  alertesGiaab = signal<any[]>([]);

  // ── UI State ───────────────────────────────────
  loading = signal(true);
  activeMenu = signal('dashboard');

  constructor(
    public auth: AuthService,
    private sb: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  async loadDashboard() {
    this.loading.set(true);
    try {
      await Promise.all([
        this.loadEtudiants(),
        this.loadPresencesAujourdhui(),
        this.loadSouratesMktmla(),
        this.loadDevoirsEnAttente(),
        this.loadAlertesGiaab()
      ]);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Charger les étudiants ──────────────────────
  async loadEtudiants() {
    const { data } = await this.sb.client
      .from('profiles')
      .select('*, groupes(nom, type)')
      .eq('role', 'etudiant')
      .order('nom');

    this.etudiants.set(data || []);
    this.totalEtudiants.set(data?.length || 0);
  }

  // ── Charger présences aujourd'hui ──────────────
  async loadPresencesAujourdhui() {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await this.sb.client
      .from('presences')
      .select('*, profiles(nom, groupe_id)')
      .eq('date', today);

    this.presencesAujourdhui.set(data || []);
    const presents = data?.filter(p => p.statut === 'حاضر').length || 0;
    this.presenceAujourdhui.set(presents);
  }

  // ── Charger sourates complètes ─────────────────
  async loadSouratesMktmla() {
    const { data } = await this.sb.client
      .from('suivi_sourates')
      .select('*')
      .eq('statut', 'مكتملة');

    this.souratesMktmla.set(data?.length || 0);
  }

  // ── Charger devoirs en attente ─────────────────
  async loadDevoirsEnAttente() {
    const { data } = await this.sb.client
      .from('soumissions')
      .select('*, devoirs(titre, deadline)')
      .eq('statut', 'لم يسلّم');

    this.devoirsRecents.set(data?.slice(0, 5) || []);
    this.devoirsEnAttente.set(data?.length || 0);
  }

  // ── Alertes absence répétée ────────────────────
  async loadAlertesGiaab() {
    const { data } = await this.sb.client
      .from('presences')
      .select('etudiant_id, statut, profiles(nom)')
      .eq('statut', 'غائب');

    // Grouper par étudiant et compter
    const counts: any = {};
    data?.forEach((p: any) => {
      const id = p.etudiant_id;
      if (!counts[id]) {
        counts[id] = { nom: p.profiles?.nom, count: 0, id };
      }
      counts[id].count++;
    });

    const alertes = Object.values(counts)
      .filter((a: any) => a.count >= 2)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    this.alertesGiaab.set(alertes);
  }

  // ── Navigation ─────────────────────────────────
  navigateTo(path: string) {
    this.activeMenu.set(path);
    this.router.navigate(['/prof', path]);
  }

  // ── Logout ─────────────────────────────────────
  async logout() {
    await this.auth.logout();
  }

  // ── Helpers ────────────────────────────────────
  getTauxPresence(): number {
    if (this.totalEtudiants() === 0) return 0;
    return Math.round((this.presenceAujourdhui() / this.totalEtudiants()) * 100);
  }

  getBadgeGroupe(type: string): string {
    const badges: any = {
      'رجال': 'badge-blue',
      'نساء': 'badge-purple',
      'أطفال': 'badge-green'
    };
    return badges[type] || 'badge-gray';
  }

    getNiveauBadge(niveau: string): string {
    const badges: any = {
      'متقدم': 'badge-green',
      'متوسط': 'badge-blue',
      'مبتدئ': 'badge-amber'
    };
    return badges[niveau] || 'badge-gray';
  }

  // ── Ajoute ici ─────────────────────────────────
  today(): string {
    return new Date().toLocaleDateString('ar-MA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

} // ← fermeture de la classe}
