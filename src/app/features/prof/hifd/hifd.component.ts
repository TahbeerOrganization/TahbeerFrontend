
import { Component,  signal,  computed,  OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {  ActivatedRoute,  RouterLink} from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SupabaseService } from '../../../core/services/supabase.service';
/* ═══════════════════════════════════════════════
   INTERFACES
═══════════════════════════════════════════════ */

interface Etudiant {
  id: number;
  nom: string;
  groupe: string;
}


interface Hifd {
  id: number;

  etudiant: {
    id?: number;
    nom: string;
    groupe: string;
  };

  sourate: string;

  ayat_debut: number;
  ayat_fin: number;
  nombre_ayat: number;

  evaluation:
    | 'ممتاز'
    | 'جيد'
    | 'متوسط'
    | 'ضعيف';

  date: string;

  notes?: string;
}


/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */

@Component({
  selector: 'app-hifd',
  standalone: true,
  imports: [CommonModule,SidebarComponent  ],
  templateUrl: './hifd.component.html',
  styleUrl: './hifd.component.css'
})
export class HifdComponent implements OnInit {


  /* ═══════════════════════════════════════════
     CONSTRUCTOR
  ═══════════════════════════════════════════ */

  constructor(
    private route: ActivatedRoute, private sb: SupabaseService
  ) {}


  /* ═══════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════ */

  loading = signal(false);

  formLoading = signal(false);

  showModal = signal(false);

  modeEdit = signal(false);
filtreGroupe = signal('');
filtreEtudiant = signal('');
filtreEvaluation = signal('');

etudiants = signal<any[]>([]);
groupes = signal<any[]>([]);

hifd = signal<Hifd[]>([]);

form = signal({
  id: null as number | null,
  etudiant_id: '',
  sourate: '',
  ayat_debut: 1,
  ayat_fin: 1,
  evaluation: '',
  notes: ''
});

ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    this.filtreEtudiant.set(params['etudiant'] || '');
    this.loadData();
  });
}

async loadData(): Promise<void> {
  this.loading.set(true);

  const { data: groupes } = await this.sb.client
    .from('groupes')
    .select('*')
    .order('nom');

  this.groupes.set(groupes || []);

  const { data: students, error } = await this.sb.client
    .from('profiles')
    .select('id, nom, groupe_id, groupes(id, nom)')
    .eq('role', 'etudiant')
    .order('nom');

  if (error) {
    this.loading.set(false);
    return;
  }

  this.etudiants.set(
    (students || []).map((e: any) => ({
      ...e,
      groupe: e.groupes?.nom || ''
    }))
  );

  await this.loadHifd();
  this.loading.set(false);
}

async loadHifd(): Promise<void> {
  const { data, error } = await this.sb.client
    .from('hifd')
    .select(`
      *,
      profiles!hifd_etudiant_id_fkey(
        id, nom, groupe_id,
        groupes(id, nom)
      )
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  this.hifd.set(
    (data || []).map((h: any) => ({
      id: h.id,
      etudiant: {
        id: h.profiles?.id,
        nom: h.profiles?.nom || '',
        groupe: h.profiles?.groupes?.nom || ''
      },
      sourate: h.sourate,
      ayat_debut: h.ayat_debut,
      ayat_fin: h.ayat_fin,
      nombre_ayat: h.nombre_ayat,
      evaluation: h.evaluation,
      date: h.date,
      notes: h.notes || ''
    }))
  );
}

hifdFiltres = computed(() => {
  const etudiant = this.filtreEtudiant();
  const groupe = this.filtreGroupe();
  const evaluation = this.filtreEvaluation();

  return this.hifd().filter(h =>
    (!etudiant || String(this.getEtudiantId(h)) === etudiant) &&
    (!groupe || this.getGroupeId(h) === Number(groupe)) &&
    (!evaluation || h.evaluation === evaluation)
  );
});

etudiantsFiltres = computed(() => {
  const groupe = this.filtreGroupe();
  return groupe
    ? this.etudiants().filter(e => String(e.groupe_id) === groupe)
    : this.etudiants();
});

totalAyat = computed(() =>
  this.hifdFiltres().reduce((t, h) => t + Number(h.nombre_ayat), 0)
);

nombreExcellent = computed(() =>
  this.hifdFiltres().filter(h => h.evaluation === 'ممتاز').length
);

nombreRevision = computed(() =>
  this.hifdFiltres().filter(h => h.evaluation === 'ضعيف').length
);

updateForm(field: string, value: any): void {
  this.form.update(f => ({ ...f, [field]: value }));
}

ouvrirAjout(): void {
  this.modeEdit.set(false);
  this.form.set({
    id: null,
    etudiant_id: this.filtreEtudiant(),
    sourate: '',
    ayat_debut: 1,
    ayat_fin: 1,
    evaluation: '',
    notes: ''
  });
  this.showModal.set(true);
}

modifier(h: Hifd): void {
  this.modeEdit.set(true);
  this.form.set({
    id: h.id,
    etudiant_id: String(this.getEtudiantId(h) || ''),
    sourate: h.sourate,
    ayat_debut: h.ayat_debut,
    ayat_fin: h.ayat_fin,
    evaluation: h.evaluation,
    notes: h.notes || ''
  });
  this.showModal.set(true);
}

fermerModal(): void {
  this.showModal.set(false);
}

async soumettre(): Promise<void> {
  const f = this.form();

  if (!f.etudiant_id || !f.sourate.trim() || !f.evaluation) return;

  const debut = Number(f.ayat_debut);
  const fin = Number(f.ayat_fin);

  if (debut < 1 || fin < debut) return;

  this.formLoading.set(true);

  const payload = {
    etudiant_id: Number(f.etudiant_id),
    sourate: f.sourate.trim(),
    ayat_debut: debut,
    ayat_fin: fin,
    nombre_ayat: fin - debut + 1,
    evaluation: f.evaluation,
    notes: f.notes || '',
    date: new Date().toISOString().split('T')[0]
  };

  const result = this.modeEdit() && f.id
    ? await this.sb.client.from('hifd').update(payload).eq('id', f.id)
    : await this.sb.client.from('hifd').insert(payload);

  if (!result.error) {
    await this.loadHifd();
    this.showModal.set(false);
  } else {
    console.error(result.error);
  }

  this.formLoading.set(false);
}

async supprimer(h: Hifd): Promise<void> {
  if (!confirm(`هل تريد حذف تسجيل حفظ ${h.sourate}؟`)) return;

  const { error } = await this.sb.client
    .from('hifd')
    .delete()
    .eq('id', h.id);

  if (!error) await this.loadHifd();
}

getEtudiantId(h: Hifd): number | undefined {
  return h.etudiant.id ||
    this.etudiants().find(e => e.nom === h.etudiant.nom)?.id;
}

getGroupeId(h: Hifd): number | null {
  const e = this.etudiants().find(x => x.id === this.getEtudiantId(h));
  return e?.groupe_id ? Number(e.groupe_id) : null;
}

getEvaluationBadge(evaluation: string): string {
  return {
    'ممتاز': 'badge-green',
    'جيد': 'badge-blue',
    'متوسط': 'badge-amber',
    'ضعيف': 'badge-gray'
  }[evaluation] || 'badge-gray';
}
}
