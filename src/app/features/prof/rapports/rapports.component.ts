import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.css'
})
export class RapportsComponent implements OnInit {

  // ── Stats globales ─────────────────────────────
  totalEtudiants = signal(0);
  totalGroupes = signal(0);
  souratesMktmla = signal(0);
  moyennePresence = signal(0);
  moyenneEval = signal(0);
  totalAyat = signal(0);

  // ── Données pour graphiques ────────────────────
  presenceParSemaine = signal<any[]>([]);
  topEtudiants = signal<any[]>([]);
  progressionSourates = signal<any[]>([]);
  repartitionGroupes = signal<any[]>([]);
  dernieresEvals = signal<any[]>([]);

  // ── Filtres ────────────────────────────────────
  periodeFilter = signal('mois');
  groupeFilter = signal('');
  groupes = signal<any[]>([]);

  loading = signal(true);

  constructor(
    private sb: SupabaseService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadGroupes();
    this.loadRapports();
  }

  async loadGroupes() {
    const { data } = await this.sb.client
      .from('groupes')
      .select('*')
      .order('nom');
    this.groupes.set(data || []);
  }

  async loadRapports() {
    this.loading.set(true);
    await Promise.all([
      this.loadStatsGlobales(),
      this.loadPresenceParSemaine(),
      this.loadTopEtudiants(),
      this.loadProgressionSourates(),
      this.loadRepartitionGroupes(),
      this.loadDernieresEvals()
    ]);
    this.loading.set(false);
  }

  // ── Stats globales ─────────────────────────────
  async loadStatsGlobales() {
    // Total étudiants
    const { count: nbEtu } = await this.sb.client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'etudiant');
    this.totalEtudiants.set(nbEtu || 0);

    // Total groupes
    const { count: nbGrp } = await this.sb.client
      .from('groupes')
      .select('*', { count: 'exact', head: true });
    this.totalGroupes.set(nbGrp || 0);

    // Sourates complètes
    const { count: nbSura } = await this.sb.client
      .from('suivi_sourates')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'مكتملة');
    this.souratesMktmla.set(nbSura || 0);

    // Total ayat mémorisées
    const { data: suivis } = await this.sb.client
      .from('suivi_sourates')
      .select('ayat_memorises');
    const total = suivis?.reduce((acc, s) => acc + (s.ayat_memorises || 0), 0) || 0;
    this.totalAyat.set(total);

    // Moyenne présence
    const { data: presences } = await this.sb.client
      .from('presences')
      .select('statut');
    if (presences && presences.length > 0) {
      const presents = presences.filter(p => p.statut === 'حاضر').length;
      this.moyennePresence.set(Math.round((presents / presences.length) * 100));
    }

    // Moyenne évaluations
    const { data: evals } = await this.sb.client
      .from('evaluations')
      .select('note, note_max');
    if (evals && evals.length > 0) {
      const moyenne = evals.reduce((acc, e) =>
        acc + (e.note / e.note_max * 20), 0) / evals.length;
      this.moyenneEval.set(Math.round(moyenne * 10) / 10);
    }
  }

  // ── Présence par semaine ───────────────────────
  async loadPresenceParSemaine() {
    const { data } = await this.sb.client
      .from('presences')
      .select('date, statut')
      .order('date', { ascending: true });

    if (!data) return;

    // Grouper par semaine
    const semaines: any = {};
    data.forEach(p => {
      const date = new Date(p.date);
      const semaine = this.getSemaineLabel(date);
      if (!semaines[semaine]) {
        semaines[semaine] = { label: semaine, present: 0, absent: 0, total: 0 };
      }
      semaines[semaine].total++;
      if (p.statut === 'حاضر') semaines[semaine].present++;
      if (p.statut === 'غائب') semaines[semaine].absent++;
    });

    const result = Object.values(semaines).slice(-6); // Dernières 6 semaines
    this.presenceParSemaine.set(result);
  }

  getSemaineLabel(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit' });
  }

  // ── Top étudiants ──────────────────────────────
  async loadTopEtudiants() {
    const { data: profiles } = await this.sb.client
      .from('profiles')
      .select('id, nom, groupe_id, groupes(nom)')
      .eq('role', 'etudiant');

    const { data: suivis } = await this.sb.client
      .from('suivi_sourates')
      .select('etudiant_id, statut, ayat_memorises');

    const { data: presences } = await this.sb.client
      .from('presences')
      .select('etudiant_id, statut');

    const { data: evals } = await this.sb.client
      .from('evaluations')
      .select('etudiant_id, note, note_max');

    const enriched = (profiles || []).map(p => {
      const eSuivis = suivis?.filter(s => s.etudiant_id === p.id) || [];
      const ePresences = presences?.filter(pr => pr.etudiant_id === p.id) || [];
      const eEvals = evals?.filter(ev => ev.etudiant_id === p.id) || [];

      const mktmla = eSuivis.filter(s => s.statut === 'مكتملة').length;
      const totalAyat = eSuivis.reduce((acc, s) => acc + (s.ayat_memorises || 0), 0);
      const tauxPresence = ePresences.length > 0
        ? Math.round((ePresences.filter(pr => pr.statut === 'حاضر').length / ePresences.length) * 100)
        : 0;
      const moyenneEval = eEvals.length > 0
        ? Math.round(eEvals.reduce((acc, ev) => acc + (ev.note / ev.note_max * 20), 0) / eEvals.length * 10) / 10
        : 0;

      // Score global (pondéré)
      const score = (mktmla * 10) + (totalAyat * 0.1) + (tauxPresence * 0.3) + (moyenneEval * 2);

      return {
        ...p,
        nb_mktmla: mktmla,
        total_ayat: totalAyat,
        taux_presence: tauxPresence,
        moyenne_eval: moyenneEval,
        score: Math.round(score)
      };
    });

    // Trier par score décroissant
    const sorted = enriched
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    this.topEtudiants.set(sorted);
  }

  // ── Progression sourates ───────────────────────
  async loadProgressionSourates() {
    const { data: sourates } = await this.sb.client
      .from('sourates')
      .select('id, nom, nom_arabe, nb_ayat')
      .order('numero');

    const { data: suivis } = await this.sb.client
      .from('suivi_sourates')
      .select('sourate_id, statut');

    const { count: totalEtu } = await this.sb.client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'etudiant');

    const result = (sourates || []).map(s => {
      const sSuivis = suivis?.filter(sv => sv.sourate_id === s.id) || [];
      const mktmla = sSuivis.filter(sv => sv.statut === 'مكتملة').length;
      const jariya = sSuivis.filter(sv => sv.statut === 'جارية').length;
      const pct = totalEtu ? Math.round((mktmla / totalEtu) * 100) : 0;

      return { ...s, nb_mktmla: mktmla, nb_jariya: jariya, pct_mktmla: pct };
    }).filter(s => s.nb_mktmla > 0 || s.nb_jariya > 0);

    this.progressionSourates.set(result);
  }

  // ── Répartition groupes ────────────────────────
  async loadRepartitionGroupes() {
    const { data: groupes } = await this.sb.client
      .from('groupes')
      .select('id, nom, type');

    const { data: profiles } = await this.sb.client
      .from('profiles')
      .select('groupe_id')
      .eq('role', 'etudiant');

    const result = (groupes || []).map(g => ({
      ...g,
      nb_etudiants: profiles?.filter(p => p.groupe_id === g.id).length || 0
    })).filter(g => g.nb_etudiants > 0);

    this.repartitionGroupes.set(result);
  }

  // ── Dernières évaluations ──────────────────────
  async loadDernieresEvals() {
    const { data } = await this.sb.client
      .from('evaluations')
      .select('*, profiles(nom), sourates(nom, nom_arabe)')
      .order('created_at', { ascending: false })
      .limit(8);

    this.dernieresEvals.set(data || []);
  }

  // ── Helpers ────────────────────────────────────
  getBarWidth(val: number, max: number): number {
    if (max === 0) return 0;
    return Math.round((val / max) * 100);
  }

  getNoteClass(note: number, max: number): string {
    const pct = (note / max) * 100;
    if (pct >= 85) return 'note-green';
    if (pct >= 65) return 'note-amber';
    return 'note-red';
  }

  getMedal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] || '⭐';
  }

  getGroupeColor(type: string): string {
    const c: any = {
      'رجال': '#1B6FA8',
      'نساء': '#534AB7',
      'أطفال': '#1D9E75'
    };
    return c[type] || '#888';
  }

  onPeriodeChange(val: string) {
    this.periodeFilter.set(val);
    this.loadRapports();
  }

  onGroupeChange(val: string) {
    this.groupeFilter.set(val);
    this.loadRapports();
  }
}