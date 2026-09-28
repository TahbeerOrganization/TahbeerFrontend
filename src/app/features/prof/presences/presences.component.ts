import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
selector: 'app-presences',
standalone: true,

imports: [
CommonModule,
FormsModule,
SidebarComponent
],

templateUrl: './presences.component.html',
styleUrl: './presences.component.css'
})
export class PresencesComponent implements OnInit {

// =========================================================
// DONNÉES
// =========================================================

etudiants = signal<any[]>([]);

groupes = signal<any[]>([]);

presences = signal<any[]>([]);

// =========================================================
// UI
// =========================================================

loading = signal(true);

saving = signal(false);

successMsg = signal('');

errorMsg = signal('');

// =========================================================
// FILTRES
// =========================================================

selectedDate = signal(
new Date().toISOString().split('T')[0]
);

selectedGroupe = signal('');

// =========================================================
// STATISTIQUES
// =========================================================

totalPresents = signal(0);

totalAbsents = signal(0);

totalRetards = signal(0);

// =========================================================
// CONSTRUCTOR
// =========================================================

constructor(
private sb: SupabaseService,
public auth: AuthService
) {}

// =========================================================
// INIT
// =========================================================

ngOnInit(): void {
this.loadData();
}
// =========================================================
// CHARGER TOUT
// =========================================================

async loadData(): Promise<void> {
this.loading.set(true);

this.errorMsg.set('');

try {

  // Charger les groupes
  await this.loadGroupes();

  // Charger les étudiants + présences
  await this.loadEtudiants();

} catch (error: any) {

  console.error(
    'Erreur chargement présences:',
    error
  );

  this.errorMsg.set(
    error?.message ||
    'خطأ في تحميل البيانات'
  );

} finally {

  this.loading.set(false);

}
}

// =========================================================
// GROUPES
// =========================================================

async loadGroupes(): Promise<void> {
const {
  data,
  error
} = await this.sb.client

  .from('groupes')

  .select(`
    id,
    nom
  `)

  .order('nom');


if (error) {

  console.error(
    'Erreur groupes:',
    error
  );

  throw error;

}


this.groupes.set(
  data ?? []
);
}

// =========================================================
// ÉTUDIANTS + GROUPES + PRÉSENCES
// =========================================================

async loadEtudiants(): Promise<void> {
this.loading.set(true);
this.errorMsg.set('');
try {

  // =====================================================
  // 1. PROFILS ÉTUDIANTS
  //
  // IMPORTANT:
  // On ne cherche PAS groupe_id dans profiles.
  // =====================================================

  const {
    data: profiles,
    error: profilesError
  } = await this.sb.client

    .from('profiles')

    .select(`
      id,
      nom,
      role,
      niveau,
      created_at
    `)

    .eq(
      'role',
      'etudiant'
    )

    .order('nom');


  if (profilesError) {

    throw profilesError;

  }


  // =====================================================
  // 2. GROUPES
  // =====================================================

  const {
    data: groupes,
    error: groupesError
  } = await this.sb.client

    .from('groupes')

    .select(`
      id,
      nom
    `)

    .order('nom');


  if (groupesError) {

    throw groupesError;

  }


  // Synchroniser le signal groupes

  this.groupes.set(
    groupes ?? []
  );


  // =====================================================
  // 3. RELATION ÉTUDIANT <-> GROUPE
  // =====================================================

  const {
    data: relations,
    error: relationsError
  } = await this.sb.client

    .from('groupe_etudiants')

    .select(`
      etudiant_id,
      groupe_id
    `);


  if (relationsError) {

    throw relationsError;

  }


  // =====================================================
  // 4. PRÉSENCES DE LA DATE
  // =====================================================

  const {
    data: presences,
    error: presencesError
  } = await this.sb.client

    .from('presences')

    .select(`
      id,
      etudiant_id,
      statut,
      note
    `)

    .eq(
      'date',
      this.selectedDate()
    );


  if (presencesError) {

    throw presencesError;

  }


  // =====================================================
  // 5. CONSTRUIRE LES DONNÉES
  // =====================================================

  let result = (
    profiles ?? []
  ).map(
    (etudiant: any) => {

      // -----------------------------------------------
      // Relation groupe
      // -----------------------------------------------

      const relation = (
        relations ?? []
      ).find(
        (r: any) =>
          String(r.etudiant_id) ===
          String(etudiant.id)
      );


      // -----------------------------------------------
      // Groupe
      // -----------------------------------------------

      const groupe = relation

        ? (
            groupes ?? []
          ).find(
            (g: any) =>
              String(g.id) ===
              String(relation.groupe_id)
          )

        : null;


      // -----------------------------------------------
      // Présence
      // -----------------------------------------------

      const presence = (
        presences ?? []
      ).find(
        (p: any) =>
          String(p.etudiant_id) ===
          String(etudiant.id)
      );


      // -----------------------------------------------
      // Retour
      // -----------------------------------------------

      return {

        id: etudiant.id,

        nom: etudiant.nom || '',

        role: etudiant.role,

        niveau: etudiant.niveau || '',

        created_at: etudiant.created_at,

        // Groupe actuel
        groupes: groupe
          ? {
              id: groupe.id,
              nom: groupe.nom
            }
          : null,

        // Présence
        statut:
          presence?.statut ?? null,

        presence_id:
          presence?.id ?? null,

        note:
          presence?.note ?? ''

      };

    }
  );


  // =====================================================
  // 6. FILTRE GROUPE
  // =====================================================

  const groupeId =
    this.selectedGroupe();


  if (groupeId) {

    result = result.filter(
      (e: any) =>

        e.groupes !== null &&

        String(e.groupes.id) ===
        String(groupeId)
    );

  }


  // =====================================================
  // 7. AFFICHER
  // =====================================================

  this.etudiants.set(
    result
  );


  // Calcul statistiques

  this.calculerStats(
    result
  );


  console.log(
    'ÉTUDIANTS PRÉSENCE:',
    result
  );


} catch (error: any) {

  console.error(
    'Erreur chargement étudiants:',
    error
  );


  this.errorMsg.set(
    error?.message ||
    'خطأ في تحميل الطلاب'
  );


  this.etudiants.set([]);

  this.calculerStats([]);

} finally {

  this.loading.set(false);

}
}

// =========================================================
// STATISTIQUES
// =========================================================

calculerStats(
etudiants: any[]
): void {
this.totalPresents.set(

  etudiants.filter(
    e =>
      e.statut === 'حاضر'
  ).length

);


this.totalAbsents.set(

  etudiants.filter(
    e =>
      e.statut === 'غائب'
  ).length

);


this.totalRetards.set(

  etudiants.filter(
    e =>
      e.statut === 'متأخر'
  ).length

);
}

// =========================================================
// CHANGER STATUT
// =========================================================

async setStatut(
etudiant: any,
statut: string
): Promise<void> {
// Ancien état
const oldEtudiants =
  this.etudiants();


// =====================================================
// UPDATE OPTIMISTE
// =====================================================

const updated =
  oldEtudiants.map(
    e =>

      e.id === etudiant.id

        ? {
            ...e,
            statut
          }

        : e
  );


this.etudiants.set(
  updated
);


this.calculerStats(
  updated
);


try {

  // ===================================================
  // CHERCHER PRÉSENCE EXISTANTE
  // ===================================================

  const {
    data: existing,
    error: findError
  } = await this.sb.client

    .from('presences')

    .select('id')

    .eq(
      'etudiant_id',
      etudiant.id
    )

    .eq(
      'date',
      this.selectedDate()
    )

    .maybeSingle();


  if (findError) {

    throw findError;

  }


  // ===================================================
  // UPDATE
  // ===================================================

  if (existing) {

    const {
      error
    } = await this.sb.client

      .from('presences')

      .update({
        statut
      })

      .eq(
        'id',
        existing.id
      );


    if (error) {

      throw error;

    }

  }


  // ===================================================
  // INSERT
  // ===================================================

  else {

    const {
      error
    } = await this.sb.client

      .from('presences')

      .insert({

        etudiant_id:
          etudiant.id,

        date:
          this.selectedDate(),

        statut

      });


    if (error) {

      throw error;

    }

  }


} catch (error: any) {

  console.error(
    'Erreur statut:',
    error
  );


  // Restaurer état
  this.etudiants.set(
    oldEtudiants
  );


  this.calculerStats(
    oldEtudiants
  );


  this.errorMsg.set(
    error?.message ||
    'خطأ في تسجيل الحضور'
  );


  setTimeout(() => {

    this.errorMsg.set('');

  }, 3000);

}
}

// =========================================================
// MARQUER TOUS PRÉSENTS
// =========================================================

async marquerTousPresents(): Promise<void> {
const etudiants =
  this.etudiants();


if (
  etudiants.length === 0
) {

  this.errorMsg.set(
    'لا يوجد طلاب لتسجيل الحضور'
  );

  return;

}


this.saving.set(true);

this.errorMsg.set('');


try {

  // ===================================================
  // Préparer les lignes
  // ===================================================

  const rows =
    etudiants.map(
      e => ({

        etudiant_id:
          e.id,

        date:
          this.selectedDate(),

        statut:
          'حاضر'

      })
    );


  // ===================================================
  // UPSERT
  // ===================================================

  const {
    error
  } = await this.sb.client

    .from('presences')

    .upsert(
      rows,
      {
        onConflict:
          'etudiant_id,date'
      }
    );


  if (error) {

    throw error;

  }


  // ===================================================
  // RECHARGER
  // ===================================================

  await this.loadEtudiants();


  // ===================================================
  // MESSAGE
  // ===================================================

  this.successMsg.set(
    '✅ تم تسجيل جميع الطلاب حاضرين!'
  );


  setTimeout(() => {

    this.successMsg.set('');

  }, 3000);


} catch (error: any) {

  console.error(
    'Erreur présence:',
    error
  );


  this.errorMsg.set(
    error?.message ||
    'خطأ في تسجيل الحضور'
  );


} finally {

  this.saving.set(false);

}
}

// =========================================================
// CHANGEMENT DATE
// =========================================================

onDateChange(
date: string
): void {
this.selectedDate.set(
  date
);
this.loadEtudiants();
}

// =========================================================
// CHANGEMENT GROUPE
// =========================================================

onGroupeChange(
groupeId: string
): void {
this.selectedGroupe.set(
  groupeId
);
this.loadEtudiants();
}
// =========================================================
// TAUX PRESENCE
// =========================================================

getTauxPresence(): number {
const total =
  this.etudiants().length;
if (total === 0) {
  return 0;
}
return Math.round(

  (
    this.totalPresents() /
    total
  ) * 100

);
}

// =========================================================
// AUJOURD'HUI
// =========================================================

isToday(): boolean {

return (

  this.selectedDate() ===

  new Date()
    .toISOString()
    .split('T')[0]

);

}

}
