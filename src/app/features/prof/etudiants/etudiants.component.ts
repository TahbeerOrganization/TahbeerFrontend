import { Component, OnInit, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-etudiants',
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './etudiants.component.html',
  styleUrl: './etudiants.component.css'
})
export class EtudiantsComponent implements OnInit {
  // ── Données ────────────────────────────────────
  etudiants = signal<any[]>([]);
  etudiantsFiltres = signal<any[]>([]);
  groupes = signal<any[]>([]);

  // ── UI State ───────────────────────────────────
  loading = signal(true);
  showModal = signal(false);
  showDeleteModal = signal(false);
  modeEdit = signal(false);
  searchQuery = signal('');
  filtreGroupe = signal('');
  filtreNiveau = signal('');

  // ── Étudiant sélectionné pour suppression ──────
  etudiantToDelete = signal<any>(null);

  // ── Formulaire ─────────────────────────────────
  form = signal({
    nom: '',
    email: '',
    password: '',
    groupe_id: '',
    niveau: '',
  });

  // ── Message feedback ───────────────────────────
  successMsg = signal('');
  errorMsg = signal('');
  formLoading = signal(false);

  // ── Étudiant en cours d'édition ────────────────
  editingId = signal('');

  constructor(
    private sb: SupabaseService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadGroupes();
    this.loadEtudiants();
  }

  // ── Charger les groupes ────────────────────────
  async loadGroupes() {
    const { data } = await this.sb.client
      .from('groupes')
      .select('*')
      .order('nom');
    this.groupes.set(data || []);
  }

  // ── Charger les étudiants ──────────────────────
  async loadEtudiants() {
  this.loading.set(true);

  // 1. Récupérer les profils
  const { data: profiles, error } = await this.sb.client
    .from('profiles')
    .select('*, groupes(id, nom, type)')
    .eq('role', 'etudiant')
    .order('nom');

  if (error) {
    this.errorMsg.set('خطأ في تحميل البيانات');
    this.loading.set(false);
    return;
  }

  // 2. Récupérer les emails via Edge Function
  const { data: usersData } = await this.sb.client.functions.invoke('get-users-emails', {
    body: { userIds: profiles?.map(p => p.id) || [] }
  });

  // 3. Fusionner email avec profil
  const emailMap: any = {};
  if (usersData?.users) {
    usersData.users.forEach((u: any) => {
      emailMap[u.id] = u.email;
    });
  }

  const enriched = (profiles || []).map(p => ({
    ...p,
    email: emailMap[p.id] || ''
  }));

  this.etudiants.set(enriched);
  this.appliquerFiltres();
  this.loading.set(false);
}

  // ── Filtres et recherche ───────────────────────
  appliquerFiltres() {
    let liste = this.etudiants();

    // Filtre recherche
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      liste = liste.filter(e =>
        e.nom?.toLowerCase().includes(q) 
      );
    }

    // Filtre groupe
    if (this.filtreGroupe()) {
      liste = liste.filter(e =>
        e.groupe_id === this.filtreGroupe()
      );
    }

    // Filtre niveau
    if (this.filtreNiveau()) {
      liste = liste.filter(e =>
        e.niveau === this.filtreNiveau()
      );
    }

    this.etudiantsFiltres.set(liste);
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
    this.appliquerFiltres();
  }

  onFiltreGroupe(value: string) {
    this.filtreGroupe.set(value);
    this.appliquerFiltres();
  }

  onFiltreNiveau(value: string) {
    this.filtreNiveau.set(value);
    this.appliquerFiltres();
  }

  // ── Ouvrir modal ajout ─────────────────────────
  ouvrirAjout() {
    this.modeEdit.set(false);
    this.editingId.set('');
    this.form.set({
      nom: '',
      email: '',
      password: '',
      groupe_id: '',
      niveau: '',
    });
    this.errorMsg.set('');
    this.successMsg.set('');
    this.showModal.set(true);
  }

  // ── Ouvrir modal modification ──────────────────
  ouvrirEdit(etudiant: any) {
    this.modeEdit.set(true);
    this.editingId.set(etudiant.id);
    this.form.set({
      nom: etudiant.nom || '',
      email: etudiant.email || '',
      password: '',
      groupe_id: etudiant.groupe_id || '',
      niveau: etudiant.niveau || '',
    });
    this.errorMsg.set('');
    this.successMsg.set('');
    this.showModal.set(true);
  }

  // ── Fermer modal ───────────────────────────────
  fermerModal() {
    this.showModal.set(false);
    this.errorMsg.set('');
    this.successMsg.set('');
  }

  // ── Soumettre formulaire ───────────────────────
  async soumettre() {
    const f = this.form();

    // Validation
    if (!f.nom || !f.groupe_id || !f.niveau) {
      this.errorMsg.set('يرجى ملء الحقول المطلوبة: الاسم، المجموعة، المستوى');
      return;
    }

    if (!this.modeEdit() && (!f.email || !f.password)) {
      this.errorMsg.set('البريد الإلكتروني وكلمة المرور مطلوبان للطالب الجديد');
      return;
    }

    this.formLoading.set(true);
    this.errorMsg.set('');

    try {
      if (this.modeEdit()) {
        // ── UPDATE ──────────────────────────────
        await this.update();
      } else {
        // ── CREATE ──────────────────────────────
        await this.create();
      }
    } catch (e: any) {
      this.errorMsg.set(e.message || 'حدث خطأ غير متوقع');
    } finally {
      this.formLoading.set(false);
    }
  }

  // ── CREATE étudiant ────────────────────────────
  private async create() {
  const f = this.form();

  // Appel à l'Edge Function — service_role reste côté serveur ✅
  const { data, error } = await this.sb.client.functions.invoke('create-user', {
    body: {
      email: f.email,
      password: f.password,
      nom: f.nom,
      groupe_id: f.groupe_id || null,
      niveau: f.niveau || null,
    }
  });

  if (error) throw error;

  this.successMsg.set('✅ تم إضافة الطالب بنجاح!');
  await this.loadEtudiants();
  setTimeout(() => this.fermerModal(), 1500);
}

  // ── UPDATE étudiant ────────────────────────────
  private async update() {
  const f = this.form();

  const { data, error } = await this.sb.client.functions.invoke('update-user', {
    body: {
      userId: this.editingId(),
      email: f.email || null,
      nom: f.nom,
      groupe_id: f.groupe_id || null,
      niveau: f.niveau || null,
    }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  this.successMsg.set('✅ تم تحديث بيانات الطالب بنجاح!');
  this.showModal.set(false);
  await this.loadEtudiants();
  setTimeout(() => this.successMsg.set(''), 3000);
}

  // ── Confirmer suppression ──────────────────────
  confirmerSuppression(etudiant: any) {
    this.etudiantToDelete.set(etudiant);
    this.showDeleteModal.set(true);
  }

  // ── Supprimer étudiant ─────────────────────────
  async supprimerEtudiant() {
    const etudiant = this.etudiantToDelete();
    if (!etudiant) return;

    this.formLoading.set(true);
    try {
      // Supprimer le profil
      const { error } = await this.sb.client
        .from('profiles')
        .delete()
        .eq('id', etudiant.id);

      if (error) throw error;

      this.showDeleteModal.set(false);
      this.etudiantToDelete.set(null);
      await this.loadEtudiants();
      this.successMsg.set('✅ تم حذف الطالب بنجاح');
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch (e: any) {
      this.errorMsg.set(e.message || 'خطأ في الحذف');
    } finally {
      this.formLoading.set(false);
    }
  }

  // ── Helpers ────────────────────────────────────
  getBadgeGroupe(type: string): string {
    const b: any = {
      'رجال': 'badge-blue',
      'نساء': 'badge-purple',
      'أطفال': 'badge-green'
    };
    return b[type] || 'badge-gray';
  }

  getNiveauBadge(niveau: string): string {
    const b: any = {
      'متقدم': 'badge-green',
      'متوسط': 'badge-blue',
      'مبتدئ': 'badge-amber'
    };
    return b[niveau] || 'badge-gray';
  }

  updateForm(field: string, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }
}
