import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SupabaseService } from '../../../core/services/supabase.service';

interface Etudiant {
id: string;
nom: string;
groupe_id?: number;
groupe?: string;
}

interface Sourate {
id: number;
nom: string;
nombre_ayat?: number;
}

interface Suivi {
id: string;
etudiant_id: string;
sourate_id: number;
ayat_debut: number;
ayat_fin: number;
statut: string;
evaluation: string;
updated_at: string;

etudiant: {
id: string;
nom: string;
groupe: string;
};

sourate: string;
}

@Component({
selector: 'app-hifd',
standalone: true,
imports: [CommonModule, SidebarComponent],
templateUrl: './hifd.component.html',
styleUrl: './hifd.component.css'
})
export class HifdComponent implements OnInit {

constructor(
private route: ActivatedRoute,
private sb: SupabaseService
) {}

loading = signal(false);
formLoading = signal(false);
showModal = signal(false);
modeEdit = signal(false);

filtreGroupe = signal('');
filtreEtudiant = signal('');
filtreStatut = signal('');

etudiants = signal<Etudiant[]>([]);
groupes = signal<any[]>([]);
sourates = signal<Sourate[]>([]);
suivi = signal<Suivi[]>([]);

form = signal({
id: null as string | null,
etudiant_id: '',
sourate_id: '',
ayat_debut: 1,
ayat_fin: 1,
statut: '',
evaluation: ''
});

ngOnInit() {
this.route.queryParams.subscribe(params => {
this.filtreEtudiant.set(params['etudiant'] || '');
this.loadData();
});
}

async loadData() {
this.loading.set(true);


try {
  /* =========================
     GROUPES
  ========================= */

  const { data: groupes, error: groupesError } =
    await this.sb.client
      .from('groupes')
      .select('id, nom')
      .order('nom');

  if (groupesError) {
    console.error('❌ GROUPES:', groupesError);
  }

  this.groupes.set(groupes || []);

  /* =========================
     SOURATES
     
     IMPORTANT:
     La table contient actuellement
     id + nom.
     On ne demande PAS nombre_ayat.
  ========================= */

  const { data: sourates, error: souratesError } =
    await this.sb.client
      .from('sourates')
      .select('id, nom')
      .order('id', { ascending: true });

  if (souratesError) {
    console.error('❌ SOURATES:', souratesError);
    this.sourates.set([]);
  } else {
    const listeSourates: Sourate[] =
      (sourates || []).map((s: any) => ({
        id: Number(s.id),
        nom: String(s.nom || '')
      }));

    console.log('✅ SOURATES:', listeSourates);

    this.sourates.set(listeSourates);
  }

  /* =========================
     ETUDIANTS
  ========================= */

  const { data: students, error: studentsError } =
    await this.sb.client
      .from('profiles')
      .select('id, nom, groupe_id')
      .eq('role', 'etudiant')
      .order('nom');
      console.log( '👨‍🎓 STUDENTS RAW:', students ); console.log( '👨‍🎓 STUDENTS ERROR:', studentsError );

  if (studentsError) {
    console.error('❌ ETUDIANTS:', studentsError);
    this.etudiants.set([]);
  } else {
    this.etudiants.set(
      (students || []).map((e: any) => ({
        id: String(e.id),
        nom: e.nom || '',
        groupe_id: e.groupe_id,
        groupe:
          groupes?.find(
            (g: any) =>
              Number(g.id) === Number(e.groupe_id)
          )?.nom || ''
      }))
    );
  }

  /* =========================
     SUIVI
  ========================= */

  await this.loadSuivi();

} catch (error) {

  console.error('❌ LOAD DATA:', error);

} finally {

  this.loading.set(false);

}


}

async loadSuivi() {
  const { data, error } = await this.sb.client
    .from('suivi_sourates')
    .select(`
      id,
      etudiant_id,
      sourate_id,
      ayat_debut,
      ayat_fin,
      statut,
      evaluation,
      updated_at,
      profiles:etudiant_id (
        id,
        nom,
        groupe_id
      ),
      sourates:sourate_id (
        id,
        nom
      )
    `)
    .order('id', { ascending: false });

  if (error) {
    console.error('❌ SUIVI ERROR:', error);
    this.suivi.set([]);
    return;
  }

  console.log('📚 SUIVI WITH JOIN:', data);

  const result: Suivi[] = (data || []).map((h: any) => {

    console.log('🔎 HIFD:', {
      id: h.id,
      etudiant_id: h.etudiant_id,
      profiles: h.profiles,
      sourates: h.sourates
    });

    return {
      id: String(h.id),

      etudiant_id: String(h.etudiant_id),

      sourate_id: Number(h.sourate_id),

      ayat_debut: Number(h.ayat_debut || 1),
      ayat_fin: Number(h.ayat_fin || 1),

      statut: h.statut || '',
      evaluation: h.evaluation || '',
      updated_at: h.updated_at || '',

      etudiant: {
        id: String(h.profiles?.id || h.etudiant_id),
        nom: h.profiles?.nom || 'طالب غير معروف',
        groupe: ''
      },

      sourate: h.sourates?.nom || 'سورة غير موجودة'
    };
  });

  this.suivi.set(result);

  console.log('✅ SUIVI FINAL:', result);
}

/* =========================
SOURATE HELPERS
========================= */

getSourateNom(): string {


const sourateId =
  Number(this.form().sourate_id);

const sourate =
  this.sourates().find(
    s => Number(s.id) === sourateId
  );

return sourate?.nom || '';


}

/* =========================
ETUDIANTS FILTRES
========================= */

etudiantsFiltres = computed(() => {


const groupe =
  this.filtreGroupe();

if (!groupe) {
  return this.etudiants();
}

return this.etudiants().filter(
  e =>
    String(e.groupe_id) === groupe
);


});

/* =========================
SUIVI FILTRE
========================= */

suiviFiltres = computed(() => {


const etudiant =
  this.filtreEtudiant();

const groupe =
  this.filtreGroupe();

const statut =
  this.filtreStatut();

return this.suivi().filter(h => {

  const student =
  this.etudiants().find(
    e => e.id === h.etudiant_id
  );

  return (

    (!etudiant ||
      h.etudiant_id === etudiant)

    &&

    (!groupe ||
      String(student?.groupe_id) === groupe)

    &&

    (!statut ||
      h.statut === statut)

  );
});


});

/* =========================
FORM
========================= */

updateForm(
field: string,
value: any
) {


this.form.update(f => ({
  ...f,
  [field]: value
}));


}

ouvrirAjout() {


this.modeEdit.set(false);

this.form.set({
  id: null,

  etudiant_id:
    this.filtreEtudiant(),

  sourate_id: '',

  ayat_debut: 1,

  ayat_fin: 1,

  statut: '',

  evaluation: ''
});

this.showModal.set(true);


}

modifier(h: Suivi) {
  console.log('✏️ EDIT:', h);

  this.modeEdit.set(true);

  this.form.set({
    id: h.id,
    etudiant_id: h.etudiant_id,
    sourate_id: String(h.sourate_id),
    ayat_debut: h.ayat_debut,
    ayat_fin: h.ayat_fin,
    statut: h.statut,
    evaluation: h.evaluation
  });

  this.showModal.set(true);
}

fermerModal() {
this.showModal.set(false);
}

/* =========================
SAVE
========================= */

async soumettre() {
  const f = this.form();

  if (
    !f.etudiant_id ||
    !f.sourate_id ||
    !f.statut ||
    !f.evaluation
  ) {
    alert('عمر جميع الخانات المطلوبة');
    return;
  }

  const debut = Number(f.ayat_debut);
  const fin = Number(f.ayat_fin);

  if (
    !Number.isInteger(debut) ||
    !Number.isInteger(fin) ||
    debut < 1 ||
    fin < debut
  ) {
    alert('الآيات المدخلة غير صحيحة');
    return;
  }

  this.formLoading.set(true);
  console.log('👤 FORM ETUDIANT ID:', f.etudiant_id);
  const payload = {
    etudiant_id: f.etudiant_id,
    sourate_id: Number(f.sourate_id),
    ayat_debut: debut,
    ayat_fin: fin,
    statut: f.statut,
    evaluation: f.evaluation,
    updated_at: new Date().toISOString()
  };

  console.log('📤 PAYLOAD:', payload);

  try {
    let result;

    if (this.modeEdit() && f.id !== null) {

      result = await this.sb.client
        .from('suivi_sourates')
        .update(payload)
        .eq('id', f.id);

    } else {

      result = await this.sb.client
        .from('suivi_sourates')
        .insert(payload);
    }

    if (result.error) {
      console.error('❌ SUPABASE:', {
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
        code: result.error.code
      });

      alert(result.error.message);
      return;
    }

    await this.loadSuivi();
    this.showModal.set(false);

  } catch (error) {

    console.error('❌ ERROR:', error);
    alert('حدث خطأ أثناء الحفظ');

  } finally {
    this.formLoading.set(false);
  }
}

/* =========================
DELETE
========================= */

async supprimer(h: Suivi) {

  if (!h.id || h.id === 'undefined' || h.id === 'null') {
    console.error('❌ HIFD ID INVALID:', h);
    alert('معرف الحفظ غير صالح');
    return;
  }

  if (!confirm(`هل تريد حذف حفظ ${h.sourate}؟`)) {
    return;
  }

  console.log('🗑️ DELETE HIFD UUID:', h.id);

  const { error } = await this.sb.client
    .from('suivi_sourates')
    .delete()
    .eq('id', h.id);

  if (error) {
    console.error('❌ DELETE ERROR:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });

    alert(error.message);
    return;
  }

  console.log('✅ DELETE OK');

  await this.loadSuivi();
}

/* =========================
BADGES
========================= */

badge(statut: string) {

return {

  'مكتمل':
    'badge-green',

  'جاري':
    'badge-blue',

  'مراجعة':
    'badge-amber',

  'لم يبدأ':
    'badge-gray'

}[statut] || 'badge-gray';

}

evaluationBadge(
evaluation: string
) {

return {

  'ممتاز':
    'badge-green',

  'جيد':
    'badge-blue',

  'متوسط':
    'badge-amber',

  'ضعيف':
    'badge-gray'

}[evaluation] || 'badge-gray';

}
}
