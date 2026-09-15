import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-mes-devoirs',
  imports: [SidebarComponent],
  templateUrl: './mes-devoirs.component.html',
  styleUrl: './mes-devoirs.component.css'
})
export class MesDevoirsComponent {

  loading = false;

  devoirs = [
    {
      id: 1,
      titre: 'تمرين سورة الفاتحة',
      description: 'قم بقراءة سورة الفاتحة وتسجيل الأخطاء التي تجدها.',
      professeur: 'الأستاذ أحمد',
      dateLimite: '20/09/2026',
      statut: 'لم يُسلّم',
    },
    {
      id: 2,
      titre: 'تمرين أحكام التجويد',
      description: 'حل التمرين المتعلق بأحكام النون الساكنة والتنوين.',
      professeur: 'الأستاذ محمد',
      dateLimite: '22/09/2026',
      statut: 'لم يُسلّم',
    },
    {
      id: 3,
      titre: 'حفظ سورة الإخلاص',
      description: 'احفظ سورة الإخلاص وقم بكتابة الآيات التي حفظتها.',
      professeur: 'الأستاذ أحمد',
      dateLimite: '25/09/2026',
      statut: 'تم التسليم',
    },
    {
      id: 4,
      titre: 'تمرين مخارج الحروف',
      description: 'حدد مخارج الحروف المطلوبة في التمرين.',
      professeur: 'الأستاذ يوسف',
      dateLimite: '28/09/2026',
      statut: 'لم يُسلّم',
    }
  ];

  selectedFiles: { [key: number]: File | null } = {};

  submitting: { [key: number]: boolean } = {};


  onFileSelected(event: Event, devoirId: number) {

    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {

      this.selectedFiles[devoirId] = input.files[0];

    }

  }


  getSelectedFile(devoirId: number): File | null {

    return this.selectedFiles[devoirId] || null;

  }


  submitDevoir(devoir: any) {

    const file = this.getSelectedFile(devoir.id);

    if (!file) {

      alert('المرجو اختيار صورة الحل أولاً');

      return;

    }

    this.submitting[devoir.id] = true;


    // Simulation d'envoi

    setTimeout(() => {

      devoir.statut = 'تم التسليم';

      this.submitting[devoir.id] = false;

      alert('تم إرسال الواجب بنجاح ✅');

    }, 1000);

  }


  onImageError(event: Event) {

    const img = event.target as HTMLImageElement;

    img.src = 'assets/images/default-course.jpg';

  }


  refresh() {

    this.loading = true;

    setTimeout(() => {

      this.loading = false;

    }, 500);

  }

}