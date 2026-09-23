import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SupabaseService } from '../../../core/services/supabase.service';
import { SidebarComponent } from '../sidebar/sidebar.component';


interface Groupe {
  id: string;
  nom: string;
  couleur: string;
  programme_id: string;
  etudiants: number;
}


interface Planning {
  id: string;
  groupe_id: string;
  jour: number;
  heure_debut: string;
  heure_fin: string;
}


@Component({
  selector: 'app-emploi-du-temps',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent
  ],

  templateUrl: './emploi.component.html',
  styleUrl: './emploi.component.css'
})
export class EmploiComponent implements OnInit {

  groupes = signal<Groupe[]>([]);
  planning = signal<Planning[]>([]);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);


  form = signal({
    id: '',
    groupe_id: '',
    jour: 1,
    heure_debut: '08:00',
    heure_fin: '09:00'
  });


  /*
   * HAUTEUR D'UNE LIGNE / JOUR
   */
  HOUR_HEIGHT = 70;


  /*
   * LARGEUR D'UNE HEURE
   */
  HOUR_WIDTH = 110;


  /*
   * PREMIERE HEURE DU CALENDRIER
   */
  CALENDAR_START = '08:00';


  /*
   * JOURS
   */
  jours = [
    { id: 1, nom: 'الإثنين' },
    { id: 2, nom: 'الثلاثاء' },
    { id: 3, nom: 'الأربعاء' },
    { id: 4, nom: 'الخميس' },
    { id: 5, nom: 'الجمعة' },
    { id: 6, nom: 'السبت' },
    { id: 7, nom: 'الأحد' }
  ];


  /*
   * HEURES
   */
  heures = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00'
  ];


  constructor(
    private sb: SupabaseService
  ) {}


  ngOnInit(): void {
    this.loadData();
  }


  /*
   * ============================
   * LOAD DATA
   * ============================
   */

  async loadData(): Promise<void> {

    this.loading.set(true);

    try {

      /*
       * GROUPES
       */

      const {
        data: groupes,
        error: groupesError
      } = await this.sb.client
        .from('groupes')
        .select(
          'id, nom, programme_id, couleur'
        )
        .order('nom');


      if (groupesError) {
        throw groupesError;
      }


      this.groupes.set(
        (groupes || []).map((g: any) => ({
          id: g.id,
          nom: g.nom,
          programme_id: g.programme_id,
          couleur: g.couleur || '#1B6FA8',
          etudiants: 0
        }))
      );


      /*
       * PLANNING
       */

      const {
        data: planning,
        error: planningError
      } = await this.sb.client
        .from('emploi_du_temps')
        .select(`
          id,
          groupe_id,
          jour,
          heure_debut,
          heure_fin
        `)
        .order('jour')
        .order('heure_debut');


      if (planningError) {
        throw planningError;
      }


      this.planning.set(
        (planning || []) as Planning[]
      );


    } catch (error) {

      console.error(
        'Erreur chargement emploi du temps:',
        error
      );

    } finally {

      this.loading.set(false);

    }

  }


  /*
   * ============================
   * TIME -> MINUTES
   * ============================
   */

  timeToMinutes(time: string): number {

    if (!time) {
      return 0;
    }

    const cleanTime =
      time.substring(0, 5);

    const [hours, minutes] =
      cleanTime
        .split(':')
        .map(Number);

    return (
      hours * 60 +
      (minutes || 0)
    );
  }


  /*
   * ============================
   * POSITION HORIZONTALE
   * ============================
   *
   * 08:00 = 0px
   * 09:00 = 110px
   * 10:00 = 220px
   * 10:30 = 275px
   *
   */

  getLeft(item: Planning): number {

    const start =
      this.timeToMinutes(
        this.CALENDAR_START
      );

    const startEvent =
      this.timeToMinutes(
        item.heure_debut
      );


    const difference =
      startEvent - start;


    return (
      difference / 60
    ) * this.HOUR_WIDTH;
  }


  /*
   * ============================
   * LARGEUR DU BLOC
   * ============================
   *
   * 1h = 110px
   * 2h = 220px
   * 30min = 55px
   *
   */

  getLargeur(item: Planning): number {

    const debut =
      this.timeToMinutes(
        item.heure_debut
      );

    const fin =
      this.timeToMinutes(
        item.heure_fin
      );


    const duree =
      fin - debut;


    return (
      duree / 60
    ) * this.HOUR_WIDTH;
  }


  /*
   * ============================
   * HAUTEUR EVENT
   * ============================
   */

  getHauteur(): number {
    return this.HOUR_HEIGHT;
  }


  /*
   * ============================
   * CHECK PLANNING
   * ============================
   */

  getPlanning(
    jour: number,
    heure: string
  ): Planning | undefined {

    const target =
      this.timeToMinutes(heure);


    return this.planning().find(item => {

      if (item.jour !== jour) {
        return false;
      }


      const debut =
        this.timeToMinutes(
          item.heure_debut
        );


      const fin =
        this.timeToMinutes(
          item.heure_fin
        );


      return (
        target >= debut &&
        target < fin
      );

    });

  }


  /*
   * ============================
   * GET GROUPE
   * ============================
   */

  getGroupe(
    groupeId: string
  ): Groupe | undefined {

    return this.groupes().find(
      groupe =>
        groupe.id === groupeId
    );
  }


  /*
   * ============================
   * AJOUT
   * ============================
   */

  ouvrirAjout(
    jour: number,
    heure: string
  ): void {

    this.form.set({

      id: '',

      groupe_id: '',

      jour,

      heure_debut: heure,

      heure_fin:
        this.getNextHour(heure)

    });


    this.showModal.set(true);
  }


  /*
   * ============================
   * NEXT HOUR
   * ============================
   */

  getNextHour(
    heure: string
  ): string {

    const total =
      this.timeToMinutes(heure) +
      60;


    const h =
      Math.floor(total / 60) % 24;


    const m =
      total % 60;


    return (
      `${String(h).padStart(2, '0')}:` +
      `${String(m).padStart(2, '0')}`
    );
  }


  /*
   * ============================
   * UPDATE FORM
   * ============================
   */

  updateForm(
    field: string,
    value: string | number
  ): void {

    this.form.update(current => ({
      ...current,
      [field]: value
    }));

  }


  /*
   * ============================
   * SAVE
   * ============================
   */

  async sauvegarder(): Promise<void> {

    const f =
      this.form();


    if (!f.groupe_id) {

      alert(
        'المرجو اختيار المجموعة'
      );

      return;
    }


    if (
      !f.heure_debut ||
      !f.heure_fin
    ) {

      alert(
        'المرجو تحديد الوقت'
      );

      return;
    }


    const debut =
      this.timeToMinutes(
        f.heure_debut
      );


    const fin =
      this.timeToMinutes(
        f.heure_fin
      );


    if (fin <= debut) {

      alert(
        'وقت النهاية يجب أن يكون بعد وقت البداية'
      );

      return;
    }


    this.saving.set(true);


    try {

      const payload = {

        groupe_id:
          f.groupe_id,

        jour:
          Number(f.jour),

        heure_debut:
          f.heure_debut,

        heure_fin:
          f.heure_fin

      };


      let error;


      /*
       * UPDATE
       */

      if (f.id) {

        const result =
          await this.sb.client
            .from('emploi_du_temps')
            .update(payload)
            .eq('id', f.id);


        error =
          result.error;

      }


      /*
       * INSERT
       */

      else {

        const result =
          await this.sb.client
            .from('emploi_du_temps')
            .insert(payload);


        error =
          result.error;
      }


      if (error) {
        throw error;
      }


      this.showModal.set(false);

      await this.loadData();


    } catch (error) {

      console.error(
        'Erreur sauvegarde planning:',
        error
      );


      alert(
        'تعذر حفظ الحصة'
      );


    } finally {

      this.saving.set(false);

    }

  }


  /*
   * ============================
   * MODIFICATION
   * ============================
   */

  ouvrirModification(
    item: Planning
  ): void {

    this.form.set({

      id:
        item.id,

      groupe_id:
        item.groupe_id,

      jour:
        item.jour,

      heure_debut:
        item.heure_debut.substring(0, 5),

      heure_fin:
        item.heure_fin.substring(0, 5)

    });


    this.showModal.set(true);
  }


  /*
   * ============================
   * DELETE
   * ============================
   */

  async supprimer(
    item: Planning
  ): Promise<void> {

    if (
      !confirm(
        'هل تريد حذف هذه الحصة؟'
      )
    ) {
      return;
    }


    try {

      const {
        error
      } = await this.sb.client

        .from('emploi_du_temps')

        .delete()

        .eq(
          'id',
          item.id
        );


      if (error) {
        throw error;
      }


      await this.loadData();


    } catch (error) {

      console.error(
        'Erreur suppression:',
        error
      );


      alert(
        'تعذر حذف الحصة'
      );

    }

  }


  /*
   * ============================
   * CLOSE MODAL
   * ============================
   */

  fermerModal(): void {

    this.showModal.set(false);

  }

}
