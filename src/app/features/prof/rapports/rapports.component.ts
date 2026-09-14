import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Etudiant {
  id: number;
  nom: string;
  groupe: string;
  sexe: 'رجل' | 'امرأة' | 'طفل';
  niveau: 'مبتدئ' | 'متوسط' | 'متقدم';
}

interface HifdRecord {
  id: number;
  etudiant_id: number;
  sourate: string;
  nombre_ayat: number;
  evaluation: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
  date: string;
}

interface PresenceRecord {
  id: number;
  etudiant_id: number;
  date: string;
  statut: 'حاضر' | 'غائب' | 'متأخر';
}

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SidebarComponent
  ],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.css'
})
export class RapportsComponent {

  /* ═══════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════ */

  mode = signal<'global' | 'etudiant'>('global');

  filtreEtudiant = signal('');

  annee = signal('2026');

  loading = signal(false);


  /* ═══════════════════════════════════════════════
     ETUDIANTS
  ═══════════════════════════════════════════════ */

  etudiants = signal<Etudiant[]>([
    {
      id: 1,
      nom: 'أحمد محمد',
      groupe: 'المجموعة أ',
      sexe: 'رجل',
      niveau: 'متقدم'
    },
    {
      id: 2,
      nom: 'فاطمة الزهراء',
      groupe: 'المجموعة أ',
      sexe: 'امرأة',
      niveau: 'متوسط'
    },
    {
      id: 3,
      nom: 'يوسف',
      groupe: 'مجموعة الأطفال',
      sexe: 'طفل',
      niveau: 'مبتدئ'
    },
    {
      id: 4,
      nom: 'مريم',
      groupe: 'مجموعة الأطفال',
      sexe: 'طفل',
      niveau: 'مبتدئ'
    },
    {
      id: 5,
      nom: 'عبد الرحمن',
      groupe: 'المجموعة ب',
      sexe: 'رجل',
      niveau: 'متوسط'
    },
    {
      id: 6,
      nom: 'خديجة',
      groupe: 'المجموعة ب',
      sexe: 'امرأة',
      niveau: 'متقدم'
    }
  ]);


  /* ═══════════════════════════════════════════════
     HIFD
  ═══════════════════════════════════════════════ */

  hifd = signal<HifdRecord[]>([
    {
      id: 1,
      etudiant_id: 1,
      sourate: 'البقرة',
      nombre_ayat: 10,
      evaluation: 'ممتاز',
      date: '2026-09-01'
    },
    {
      id: 2,
      etudiant_id: 1,
      sourate: 'البقرة',
      nombre_ayat: 15,
      evaluation: 'ممتاز',
      date: '2026-09-05'
    },
    {
      id: 3,
      etudiant_id: 1,
      sourate: 'آل عمران',
      nombre_ayat: 12,
      evaluation: 'جيد',
      date: '2026-09-10'
    },

    {
      id: 4,
      etudiant_id: 2,
      sourate: 'الفاتحة',
      nombre_ayat: 7,
      evaluation: 'جيد',
      date: '2026-09-01'
    },
    {
      id: 5,
      etudiant_id: 2,
      sourate: 'البقرة',
      nombre_ayat: 8,
      evaluation: 'ممتاز',
      date: '2026-09-08'
    },

    {
      id: 6,
      etudiant_id: 3,
      sourate: 'الفاتحة',
      nombre_ayat: 7,
      evaluation: 'متوسط',
      date: '2026-09-02'
    },
    {
      id: 7,
      etudiant_id: 3,
      sourate: 'الإخلاص',
      nombre_ayat: 4,
      evaluation: 'جيد',
      date: '2026-09-07'
    },

    {
      id: 8,
      etudiant_id: 5,
      sourate: 'النساء',
      nombre_ayat: 14,
      evaluation: 'ممتاز',
      date: '2026-09-03'
    },
    {
      id: 9,
      etudiant_id: 6,
      sourate: 'يس',
      nombre_ayat: 12,
      evaluation: 'ممتاز',
      date: '2026-09-04'
    }
  ]);


  /* ═══════════════════════════════════════════════
     PRESENCE
  ═══════════════════════════════════════════════ */

  presences = signal<PresenceRecord[]>([
    {
      id: 1,
      etudiant_id: 1,
      date: '2026-09-01',
      statut: 'حاضر'
    },
    {
      id: 2,
      etudiant_id: 1,
      date: '2026-09-02',
      statut: 'حاضر'
    },
    {
      id: 3,
      etudiant_id: 1,
      date: '2026-09-03',
      statut: 'غائب'
    },
    {
      id: 4,
      etudiant_id: 1,
      date: '2026-09-04',
      statut: 'حاضر'
    },
    {
      id: 5,
      etudiant_id: 1,
      date: '2026-09-05',
      statut: 'متأخر'
    },

    {
      id: 6,
      etudiant_id: 2,
      date: '2026-09-01',
      statut: 'حاضر'
    },
    {
      id: 7,
      etudiant_id: 2,
      date: '2026-09-02',
      statut: 'غائب'
    },
    {
      id: 8,
      etudiant_id: 2,
      date: '2026-09-03',
      statut: 'حاضر'
    },
    {
      id: 9,
      etudiant_id: 2,
      date: '2026-09-04',
      statut: 'حاضر'
    },

    {
      id: 10,
      etudiant_id: 3,
      date: '2026-09-01',
      statut: 'حاضر'
    },
    {
      id: 11,
      etudiant_id: 3,
      date: '2026-09-02',
      statut: 'حاضر'
    },
    {
      id: 12,
      etudiant_id: 3,
      date: '2026-09-03',
      statut: 'حاضر'
    }
  ]);


  /* ═══════════════════════════════════════════════
     SELECTED STUDENT
  ═══════════════════════════════════════════════ */

  etudiantSelectionne = computed(() => {

    const id = Number(this.filtreEtudiant());

    if (!id) {
      return null;
    }

    return this.etudiants().find(e => e.id === id) || null;
  });


  /* ═══════════════════════════════════════════════
     CURRENT HIFD
  ═══════════════════════════════════════════════ */

  hifdActuel = computed(() => {

    const id = Number(this.filtreEtudiant());

    if (this.mode() === 'global' || !id) {
      return this.hifd();
    }

    return this.hifd().filter(
      h => h.etudiant_id === id
    );
  });


  /* ═══════════════════════════════════════════════
     CURRENT PRESENCE
  ═══════════════════════════════════════════════ */

  presenceActuelle = computed(() => {

    const id = Number(this.filtreEtudiant());

    if (this.mode() === 'global' || !id) {
      return this.presences();
    }

    return this.presences().filter(
      p => p.etudiant_id === id
    );
  });


  /* ═══════════════════════════════════════════════
     GLOBAL STATS
  ═══════════════════════════════════════════════ */

  totalEtudiants = computed(() =>
    this.etudiants().length
  );

  totalHommes = computed(() =>
    this.etudiants().filter(
      e => e.sexe === 'رجل'
    ).length
  );

  totalFemmes = computed(() =>
    this.etudiants().filter(
      e => e.sexe === 'امرأة'
    ).length
  );

  totalEnfants = computed(() =>
    this.etudiants().filter(
      e => e.sexe === 'طفل'
    ).length
  );

  totalAyat = computed(() =>
    this.hifdActuel().reduce(
      (total, h) => total + h.nombre_ayat,
      0
    )
  );

  totalPresence = computed(() =>
    this.presenceActuelle().filter(
      p => p.statut === 'حاضر'
    ).length
  );

  totalAbsence = computed(() =>
    this.presenceActuelle().filter(
      p => p.statut === 'غائب'
    ).length
  );

  totalRetard = computed(() =>
    this.presenceActuelle().filter(
      p => p.statut === 'متأخر'
    ).length
  );


  /* ═══════════════════════════════════════════════
     STUDENT STATS
  ═══════════════════════════════════════════════ */

  studentAyat = computed(() => {

    if (!this.etudiantSelectionne()) {
      return 0;
    }

    return this.hifdActuel().reduce(
      (total, h) => total + h.nombre_ayat,
      0
    );
  });


  studentExcellent = computed(() =>
    this.hifdActuel().filter(
      h => h.evaluation === 'ممتاز'
    ).length
  );


  studentBon = computed(() =>
    this.hifdActuel().filter(
      h => h.evaluation === 'جيد'
    ).length
  );


  studentRevision = computed(() =>
    this.hifdActuel().filter(
      h => h.evaluation === 'متوسط' ||
           h.evaluation === 'ضعيف'
    ).length
  );


  /* ═══════════════════════════════════════════════
     GENDER CHART
  ═══════════════════════════════════════════════ */

  genderTotal = computed(() => {

    return (
      this.totalHommes() +
      this.totalFemmes() +
      this.totalEnfants()
    );

  });


  genderPercent(value: number): number {

    const total = this.genderTotal();

    if (!total) {
      return 0;
    }

    return Math.round(
      (value / total) * 100
    );
  }


  /* ═══════════════════════════════════════════════
     GROUP CHART
  ═══════════════════════════════════════════════ */

  groupesStats = computed(() => {

    const map = new Map<string, number>();

    this.etudiants().forEach(e => {

      map.set(
        e.groupe,
        (map.get(e.groupe) || 0) + 1
      );

    });

    return Array.from(map.entries()).map(
      ([nom, total]) => ({
        nom,
        total
      })
    );

  });


  groupeMax = computed(() => {

    return Math.max(
      ...this.groupesStats().map(
        g => g.total
      ),
      1
    );

  });


  /* ═══════════════════════════════════════════════
     HIFD TREND
  ═══════════════════════════════════════════════ */

  hifdTrend = computed(() => {

    const records = [...this.hifdActuel()]
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

    let total = 0;

    return records.map(h => {

      total += h.nombre_ayat;

      return {
        date: this.formatShortDate(h.date),
        total
      };

    });

  });


  hifdMax = computed(() => {

    return Math.max(
      ...this.hifdTrend().map(
        p => p.total
      ),
      1
    );

  });


  /* ═══════════════════════════════════════════════
     PRESENCE BY DATE
  ═══════════════════════════════════════════════ */

  presenceDates = computed(() => {

    const map = new Map<
      string,
      {
        date: string;
        present: number;
        absent: number;
        late: number;
      }
    >();

    this.presenceActuelle().forEach(p => {

      if (!map.has(p.date)) {

        map.set(p.date, {
          date: p.date,
          present: 0,
          absent: 0,
          late: 0
        });

      }

      const item = map.get(p.date)!;

      if (p.statut === 'حاضر') {
        item.present++;
      }

      if (p.statut === 'غائب') {
        item.absent++;
      }

      if (p.statut === 'متأخر') {
        item.late++;
      }

    });

    return Array.from(map.values())
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

  });


  presenceMax = computed(() => {

    return Math.max(
      ...this.presenceDates().map(
        p =>
          p.present +
          p.absent +
          p.late
      ),
      1
    );

  });


  /* ═══════════════════════════════════════════════
     ACTIONS
  ═══════════════════════════════════════════════ */

  afficherGlobal() {

    this.mode.set('global');

    this.filtreEtudiant.set('');

  }


  afficherEtudiant() {

    this.mode.set('etudiant');

  }


  changerEtudiant(value: string) {

    this.filtreEtudiant.set(value);

    this.mode.set('etudiant');

  }


  changerAnnee(value: string) {

    this.annee.set(value);

  }


  actualiser() {

    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);
    }, 400);

  }


  /* ═══════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════ */

  formatShortDate(date: string): string {

    const d = new Date(date);

    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}`;

  }


  formatDate(date: string): string {

    const d = new Date(date);

    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;

  }


  getBarWidth(value: number, max: number): string {

    return `${Math.round((value / max) * 100)}%`;

  }


  getLinePoints(): string {

    const data = this.hifdTrend();

    if (!data.length) {
      return '';
    }

    const width = 600;
    const height = 220;

    return data
      .map((item, index) => {

        const x =
          data.length === 1
            ? width / 2
            : (index / (data.length - 1)) *
              width;

        const y =
          height -
          (item.total / this.hifdMax()) *
            height;

        return `${x},${y}`;

      })
      .join(' ');

  }


  getPointX(index: number): number {

    const data = this.hifdTrend();

    if (data.length <= 1) {
      return 300;
    }

    return (
      (index / (data.length - 1)) *
      600
    );

  }


  getPointY(value: number): number {

    return (
      220 -
      (value / this.hifdMax()) *
        220
    );

  }


  getEvaluationLabel(
    evaluation: string
  ): string {

    switch (evaluation) {

      case 'ممتاز':
        return 'ممتاز';

      case 'جيد':
        return 'جيد';

      case 'متوسط':
        return 'متوسط';

      case 'ضعيف':
        return 'يحتاج إلى مراجعة';

      default:
        return evaluation;

    }

  }

}