import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Programme {
  id: string;
  nom: string;
}

interface Etudiant {
  id: string;
  nom: string;
}

interface Groupe {
  id: string;
  nom: string;
  couleur: string;
  programme_id: string;
  etudiants: number;
}

@Component({
  selector: 'app-groupes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent
  ],
  templateUrl: './groupes.component.html',
  styleUrl: './groupes.component.css'
})
export class GroupesComponent implements OnInit {

  // =========================================================
  // DONNÉES
  // =========================================================

  programmes = signal<Programme[]>([]);
  groupes = signal<Groupe[]>([]);
  etudiants = signal<Etudiant[]>([]);

  programmeSelectionne = signal<Programme | null>(null);
  groupesProgramme = signal<Groupe[]>([]);

  // IDs des étudiants actuellement sélectionnés
  selected = signal<string[]>([]);

  // =========================================================
  // ÉTAT
  // =========================================================

  loading = signal(true);
  formLoading = signal(false);

  showModal = signal(false);
  showDeleteModal = signal(false);
  modeEdit = signal(false);

  groupeToDelete = signal<Groupe | null>(null);

  successMsg = signal('');
  errorMsg = signal('');

  // =========================================================
  // FORMULAIRE
  // =========================================================

  form = signal({
    id: '',
    programme_id: '',
    nom: '',
    couleur: '#3b82f6'
  });

  couleurs = [
    '#3b82f6',
    '#22c55e',
    '#8b5cf6',
    '#f97316',
    '#ef4444',
    '#eab308',
    '#06b6d4',
    '#ec4899'
  ];

  constructor(private sb: SupabaseService) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadData();
  }

  // =========================================================
  // CHARGER LES DONNÉES
  // =========================================================

  
  
  

async loadData(): Promise<void> {
  this.loading.set(true);
  this.errorMsg.set('');

  try {
    const { data, error, status } = await this.sb.client
      .from('programmes')
      .select('id, nom')
      .order('nom');

    console.log('Supabase status:', status);
    console.log('Supabase error:', error);
    console.log('Programmes reçus:', data?.length ?? 0);

    if (error) {
      throw error;
    }

    this.programmes.set(data ?? []);

  } catch (err: any) {
    console.error('Erreur chargement programmes:', err);

    this.errorMsg.set(
      err?.message || 'Erreur de chargement des programmes'
    );
  } finally {
    this.loading.set(false);
  }
}

  // =========================================================
  // PROGRAMME
  // =========================================================

  selectionnerProgramme(
    programme: Programme
  ): void {

    this.programmeSelectionne.set(programme);

    this.actualiserGroupesProgramme();

    this.errorMsg.set('');
    this.successMsg.set('');
  }

  retourProgrammes(): void {

    this.programmeSelectionne.set(null);

    this.groupesProgramme.set([]);

    this.selected.set([]);

    this.fermerModal();

    this.errorMsg.set('');
    this.successMsg.set('');
  }

  // =========================================================
  // GROUPES DU PROGRAMME
  // =========================================================

  actualiserGroupesProgramme(): void {

    const programme =
      this.programmeSelectionne();

    if (!programme) {

      this.groupesProgramme.set([]);

      return;
    }

    this.groupesProgramme.set(
      this.groupes().filter(
        groupe =>
          groupe.programme_id === programme.id
      )
    );
  }

  compterGroupesProgramme(
    programmeId: string
  ): number {

    return this.groupes().filter(
      groupe =>
        groupe.programme_id === programmeId
    ).length;
  }

  // =========================================================
  // AJOUT GROUPE
  // =========================================================

  ouvrirAjoutGroupe(): void {

    const programme =
      this.programmeSelectionne();

    if (!programme) {

      this.errorMsg.set(
        'يرجى اختيار البرنامج'
      );

      return;
    }

    this.modeEdit.set(false);

    this.form.set({
      id: '',
      programme_id: programme.id,
      nom: '',
      couleur: '#3b82f6'
    });

    // مهم: المجموعة الجديدة تبدأ بلا طلاب
    this.selected.set([]);

    this.errorMsg.set('');
    this.successMsg.set('');

    this.showModal.set(true);
  }

  // =========================================================
  // MODIFIER GROUPE
  // =========================================================

  async ouvrirEditGroupe(
    groupe: Groupe
  ): Promise<void> {

    this.modeEdit.set(true);

    this.form.set({
      id: groupe.id,
      programme_id: groupe.programme_id,
      nom: groupe.nom,
      couleur: groupe.couleur
    });

    // نفرغ الاختيار قبل تحميل الطلاب
    this.selected.set([]);

    this.errorMsg.set('');
    this.successMsg.set('');

    this.showModal.set(true);

    try {

      const {
        data,
        error
      } = await this.sb.client
        .from('groupe_etudiants')
        .select('etudiant_id')
        .eq('groupe_id', groupe.id);

      if (error) {
        throw error;
      }

      // نحيد التكرار احتياطياً
      const ids: string[] = [
        ...new Set(
          (data || [])
            .map((item: any) => item.etudiant_id)
            .filter(
              (id: any): id is string =>
                typeof id === 'string'
            )
        )
      ];

      // هادو هما الطلاب لي checked فالـ modal
      this.selected.set(ids);

    } catch (error: any) {

      console.error(
        'Erreur chargement étudiants:',
        error
      );

      this.errorMsg.set(
        error?.message ||
        'تعذر تحميل طلاب المجموعة'
      );
    }
  }

  // =========================================================
  // FERMER MODAL
  // =========================================================

  fermerModal(): void {

    this.showModal.set(false);

    this.selected.set([]);

    this.form.set({
      id: '',
      programme_id: '',
      nom: '',
      couleur: '#3b82f6'
    });

    this.modeEdit.set(false);
  }

  // =========================================================
  // FORMULAIRE
  // =========================================================

  updateForm(
    field: string,
    value: string
  ): void {

    this.form.update(
      current => ({
        ...current,
        [field]: value
      })
    );
  }

  // =========================================================
  // SÉLECTION ÉTUDIANT
  // =========================================================

  toggleEtudiant(
    id: string
  ): void {

    this.selected.update(
      current => {

        // إذا كان مختار -> نحيدوه
        if (current.includes(id)) {

          return current.filter(
            item => item !== id
          );
        }

        // إذا ماكانش مختار -> نضيفوه
        return [
          ...current,
          id
        ];
      }
    );
  }

  // =========================================================
  // VÉRIFIER SI ÉTUDIANT SÉLECTIONNÉ
  // =========================================================

  estSelectionne(
    id: string
  ): boolean {

    return this.selected().includes(id);
  }

  // =========================================================
  // ENREGISTRER GROUPE
  // =========================================================

async soumettre(): Promise<void> {
  const f = this.form();
  const programme = this.programmeSelectionne();

  // =====================================================
  // VALIDATION
  // =====================================================

  if (!programme) {
    this.errorMsg.set('يرجى اختيار البرنامج');
    return;
  }

  const nom = f.nom.trim();

  if (!nom) {
    this.errorMsg.set('يرجى إدخال اسم المجموعة');
    return;
  }

  if (this.formLoading()) {
    return;
  }

  this.formLoading.set(true);
  this.errorMsg.set('');
  this.successMsg.set('');

  try {
    let groupeId: string;

    // =====================================================
    // 1. CRÉER OU MODIFIER LE GROUPE
    // =====================================================

    if (this.modeEdit()) {

      groupeId = f.id;

      if (!groupeId) {
        throw new Error('ID du groupe introuvable');
      }

      const { error } = await this.sb.client
        .from('groupes')
        .update({
          nom: nom,
          couleur: f.couleur,
          programme_id: programme.id
        })
        .eq('id', groupeId);

      if (error) {
        throw error;
      }

    } else {

      const {
        data,
        error
      } = await this.sb.client
        .from('groupes')
        .insert({
          programme_id: programme.id,
          nom: nom,
          couleur: f.couleur
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          'Impossible de récupérer l\'ID du groupe'
        );
      }

      groupeId = data.id;
    }

    // =====================================================
    // 2. PRENDRE LA LISTE ACTUELLE DES ÉTUDIANTS
    // =====================================================

    const selectedStudents: string[] = Array.from(
      new Set(this.selected())
    );

    console.log(
      'GROUPE ID:',
      groupeId
    );

    console.log(
      'ETUDIANTS SÉLECTIONNÉS:',
      selectedStudents
    );

    // =====================================================
    // 3. SUPPRIMER TOUTES LES ANCIENNES RELATIONS
    // =====================================================

    const {
      error: deleteError
    } = await this.sb.client
      .from('groupe_etudiants')
      .delete()
      .eq('groupe_id', groupeId);

    if (deleteError) {
      console.error(
        'Erreur suppression relations:',
        deleteError
      );

      throw deleteError;
    }

    // =====================================================
    // 4. RÉINSÉRER UNIQUEMENT LES ÉTUDIANTS SÉLECTIONNÉS
    // =====================================================

    if (selectedStudents.length > 0) {

      const rows: {
        groupe_id: string;
        etudiant_id: string;
      }[] = selectedStudents.map(
        (etudiantId: string) => ({
          groupe_id: groupeId,
          etudiant_id: etudiantId
        })
      );

      console.log(
        'ROWS À INSÉRER:',
        rows
      );

      const {
        data: insertedRows,
        error: insertError
      } = await this.sb.client
        .from('groupe_etudiants')
        .insert(rows)
        .select();

      if (insertError) {

        console.error(
          'ERREUR INSERTION RELATIONS:',
          insertError
        );

        console.error(
          'ROWS:',
          rows
        );

        throw insertError;
      }

      console.log(
        'RELATIONS INSÉRÉES:',
        insertedRows
      );
    }

    // =====================================================
    // 5. SUCCÈS
    // =====================================================

    this.successMsg.set(
      this.modeEdit()
        ? 'تم تعديل المجموعة بنجاح'
        : 'تم إنشاء المجموعة بنجاح'
    );

    this.fermerModal();

    await this.loadData();

    this.actualiserGroupesProgramme();

    setTimeout(() => {
      this.successMsg.set('');
    }, 3000);

  } catch (error: any) {

    console.error(
      'ERREUR SAUVEGARDE GROUPE:',
      error
    );

    console.error(
      'CODE:',
      error?.code
    );

    console.error(
      'MESSAGE:',
      error?.message
    );

    console.error(
      'DETAILS:',
      error?.details
    );

    console.error(
      'HINT:',
      error?.hint
    );

    if (error?.code === '23505') {

      this.errorMsg.set(
        'حدث تكرار في علاقة الطالب بالمجموعة. تحقق من قاعدة البيانات.'
      );

    } else {

      this.errorMsg.set(
        error?.message ||
        'حدث خطأ أثناء حفظ المجموعة'
      );
    }

  } finally {

    this.formLoading.set(false);
  }
}


  // =========================================================
  // CONFIRMATION SUPPRESSION
  // =========================================================

  confirmerSuppression(
    groupe: Groupe
  ): void {

    this.groupeToDelete.set(groupe);

    this.showDeleteModal.set(true);

    this.errorMsg.set('');
  }

  // =========================================================
  // ANNULER SUPPRESSION
  // =========================================================

  annulerSuppression(): void {

    this.showDeleteModal.set(false);

    this.groupeToDelete.set(null);
  }

  // =========================================================
  // SUPPRIMER GROUPE
  // =========================================================

  async supprimerGroupe(): Promise<void> {

    const groupe =
      this.groupeToDelete();

    if (!groupe) {
      return;
    }

    if (this.formLoading()) {
      return;
    }

    this.formLoading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    try {

      // =====================================================
      // SUPPRIMER RELATIONS
      // =====================================================

      const {
        error: relationError
      } = await this.sb.client
        .from('groupe_etudiants')
        .delete()
        .eq('groupe_id', groupe.id);

      if (relationError) {
        throw relationError;
      }

      // =====================================================
      // SUPPRIMER GROUPE
      // =====================================================

      const {
        error: groupeError
      } = await this.sb.client
        .from('groupes')
        .delete()
        .eq('id', groupe.id);

      if (groupeError) {
        throw groupeError;
      }

      // =====================================================
      // NETTOYAGE
      // =====================================================

      this.showDeleteModal.set(false);

      this.groupeToDelete.set(null);

      // =====================================================
      // RECHARGER
      // =====================================================

      await this.loadData();

      this.actualiserGroupesProgramme();

      // =====================================================
      // MESSAGE
      // =====================================================

      this.successMsg.set(
        'تم حذف المجموعة بنجاح'
      );

      setTimeout(() => {

        this.successMsg.set('');

      }, 3000);

    } catch (error: any) {

      console.error(
        'Erreur suppression:',
        error
      );

      this.errorMsg.set(
        error?.message ||
        'تعذر حذف المجموعة'
      );

    } finally {

      this.formLoading.set(false);
    }
  }
}
