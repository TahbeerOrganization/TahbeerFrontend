import { Component,  signal,  computed,  OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {  ActivatedRoute,  RouterLink} from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';


/* ═══════════════════════════════════════════════
   INTERFACES
═══════════════════════════════════════════════ */

interface Etudiant {
  id: number;
  nom: string;
  groupe: string;
}


interface Paiement {
  id: number;
  etudiant_id: number;
  mois: number;
  annee: number;
  montant: number;
  paye: boolean;
  date_paiement?: string;
}


/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */

@Component({
  selector: 'app-paiements',


  imports: [
    CommonModule,
    RouterLink,
    SidebarComponent
  ],

  templateUrl: './payement.component.html',

  styleUrl: './payement.component.css'
})
export class PaiementsComponent implements OnInit {


  /* ═══════════════════════════════════════════
     CONSTRUCTOR
  ═══════════════════════════════════════════ */

  constructor(
    private route: ActivatedRoute
  ) {}


  /* ═══════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════ */

  loading = signal(false);

  saving = signal(false);


  /* ═══════════════════════════════════════════
     FILTER
  ═══════════════════════════════════════════ */

  filtreEtudiant = signal('');


  annee = signal(
    new Date().getFullYear()
  );


  montantMensuel = signal(200);


  /* ═══════════════════════════════════════════
     MONTHS
  ═══════════════════════════════════════════ */

  mois = [
    {
      id: 1,
      nom: 'يناير'
    },
    {
      id: 2,
      nom: 'فبراير'
    },
    {
      id: 3,
      nom: 'مارس'
    },
    {
      id: 4,
      nom: 'أبريل'
    },
    {
      id: 5,
      nom: 'ماي'
    },
    {
      id: 6,
      nom: 'يونيو'
    },
    {
      id: 7,
      nom: 'يوليوز'
    },
    {
      id: 8,
      nom: 'غشت'
    },
    {
      id: 9,
      nom: 'شتنبر'
    },
    {
      id: 10,
      nom: 'أكتوبر'
    },
    {
      id: 11,
      nom: 'نونبر'
    },
    {
      id: 12,
      nom: 'دجنبر'
    }
  ];


  /* ═══════════════════════════════════════════
     ETUDIANTS
  ═══════════════════════════════════════════ */

  etudiants = signal<Etudiant[]>([

    {
      id: 1,
      nom: 'abcd',
      groupe: 'المجموعة أ'
    },

    {
      id: 2,
      nom: 'ra',
      groupe: 'مجموعة الأطفال'
    }

  ]);


  /* ═══════════════════════════════════════════
     PAIEMENTS
  ═══════════════════════════════════════════ */

  paiements = signal<Paiement[]>([

    {
      id: 1,
      etudiant_id: 1,
      mois: 1,
      annee: 2026,
      montant: 200,
      paye: true,
      date_paiement: '2026-01-05'
    },

    {
      id: 2,
      etudiant_id: 1,
      mois: 2,
      annee: 2026,
      montant: 200,
      paye: true,
      date_paiement: '2026-02-04'
    },

    {
      id: 3,
      etudiant_id: 1,
      mois: 3,
      annee: 2026,
      montant: 200,
      paye: false
    },

    {
      id: 4,
      etudiant_id: 2,
      mois: 1,
      annee: 2026,
      montant: 200,
      paye: true,
      date_paiement: '2026-01-08'
    }

  ]);


  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      const etudiantId =
        params['etudiant'];

      if (etudiantId) {

        this.filtreEtudiant.set(
          String(etudiantId)
        );

      }

      this.loadPaiements();

    });

  }


  /* ═══════════════════════════════════════════
     LOAD
  ═══════════════════════════════════════════ */

  loadPaiements(): void {

    this.loading.set(true);

    setTimeout(() => {

      this.loading.set(false);

    }, 300);

  }


  /* ═══════════════════════════════════════════
     ETUDIANT SELECTIONNE
  ═══════════════════════════════════════════ */

  etudiantSelectionne = computed(() => {

    const id =
      Number(this.filtreEtudiant());

    return this.etudiants().find(
      e => e.id === id
    );

  });


  /* ═══════════════════════════════════════════
     PAIEMENTS DE L'ETUDIANT
  ═══════════════════════════════════════════ */

  paiementsEtudiant = computed(() => {

    const id =
      Number(this.filtreEtudiant());

    if (!id) {

      return [];

    }

    return this.paiements().filter(p =>

      p.etudiant_id === id &&
      p.annee === this.annee()

    );

  });


  /* ═══════════════════════════════════════════
     NOMBRE MOIS PAYES
  ═══════════════════════════════════════════ */

  nombreMoisPayes = computed(() => {

    return this.paiementsEtudiant()
      .filter(p => p.paye)
      .length;

  });


  /* ═══════════════════════════════════════════
     NOMBRE MOIS NON PAYES
  ═══════════════════════════════════════════ */

  nombreMoisNonPayes = computed(() => {

    return 12 - this.nombreMoisPayes();

  });


  /* ═══════════════════════════════════════════
     TOTAL PAYE
  ═══════════════════════════════════════════ */

  totalPaye = computed(() => {

    return this.paiementsEtudiant()
      .filter(p => p.paye)
      .reduce(
        (total, p) =>
          total + p.montant,
        0
      );

  });


  /* ═══════════════════════════════════════════
     TOTAL RESTANT
  ═══════════════════════════════════════════ */

  totalRestant = computed(() => {

    return (
      this.nombreMoisNonPayes() *
      this.montantMensuel()
    );

  });


  /* ═══════════════════════════════════════════
     IS MONTH PAID
  ═══════════════════════════════════════════ */

  estPaye(mois: number): boolean {

    const paiement =
      this.paiementsEtudiant().find(
        p =>
          p.mois === mois &&
          p.annee === this.annee()
      );

    return paiement?.paye ?? false;

  }


  /* ═══════════════════════════════════════════
     GET PAYMENT
  ═══════════════════════════════════════════ */

  getPaiement(
    mois: number
  ): Paiement | undefined {

    return this.paiementsEtudiant()
      .find(
        p =>
          p.mois === mois &&
          p.annee === this.annee()
      );

  }


  /* ═══════════════════════════════════════════
     TOGGLE PAYMENT
  ═══════════════════════════════════════════ */

  togglePaiement(
    mois: number
  ): void {

    const studentId =
      Number(this.filtreEtudiant());

    if (!studentId) {

      return;

    }


    const existing =
      this.getPaiement(mois);


    /* ═══════════════════════════════
       EXISTING PAYMENT
    ═══════════════════════════════ */

    if (existing) {

      this.paiements.update(list =>

        list.map(p => {

          if (p.id !== existing.id) {

            return p;

          }


          return {

            ...p,

            paye: !p.paye,

            date_paiement:
              !p.paye
                ? new Date()
                    .toISOString()
                    .split('T')[0]
                : undefined

          };

        })

      );

      return;

    }


    /* ═══════════════════════════════
       NEW PAYMENT
    ═══════════════════════════════ */

    const newId =

      this.paiements().length > 0

        ? Math.max(
            ...this.paiements()
              .map(p => p.id)
          ) + 1

        : 1;


    this.paiements.update(list => [

      ...list,

      {

        id: newId,

        etudiant_id:
          studentId,

        mois,

        annee:
          this.annee(),

        montant:
          this.montantMensuel(),

        paye: true,

        date_paiement:
          new Date()
            .toISOString()
            .split('T')[0]

      }

    ]);

  }


  /* ═══════════════════════════════════════════
     SET YEAR
  ═══════════════════════════════════════════ */

  changerAnnee(
    value: string
  ): void {

    this.annee.set(
      Number(value)
    );

  }


  /* ═══════════════════════════════════════════
     SET MONTHLY PRICE
  ═══════════════════════════════════════════ */

  changerMontant(
    value: string
  ): void {

    this.montantMensuel.set(
      Number(value) || 0
    );

  }


  /* ═══════════════════════════════════════════
     FORMAT MONEY
  ═══════════════════════════════════════════ */

  formatMoney(
    amount: number
  ): string {

    return `${amount} DH`;

  }

}
