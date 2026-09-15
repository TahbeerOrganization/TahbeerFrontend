import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-mes-cours',
  imports: [SidebarComponent],
  templateUrl: './mes-cours.component.html',
  styleUrl: './mes-cours.component.css'
})
export class MesCoursComponent {

  loading = false;

  cours = [
    {
      id: 1,
      titre: 'سورة الفاتحة',
      description: 'تعلم وحفظ سورة الفاتحة مع شرح الآيات.',
      professeur: 'الأستاذ أحمد',
      date: '15/09/2026',
      image: 'assets/images/cours-1.jpg'
    },
    {
      id: 2,
      titre: 'أحكام التجويد',
      description: 'درس حول أحكام النون الساكنة والتنوين.',
      professeur: 'الأستاذ محمد',
      date: '14/09/2026',
      image: 'assets/images/cours-2.jpg'
    },
    {
      id: 3,
      titre: 'سورة الإخلاص',
      description: 'شرح وحفظ سورة الإخلاص.',
      professeur: 'الأستاذ أحمد',
      date: '12/09/2026',
      image: 'assets/images/cours-3.jpg'
    },
    {
      id: 4,
      titre: 'مخارج الحروف',
      description: 'التعرف على مخارج الحروف وطريقة نطقها.',
      professeur: 'الأستاذ يوسف',
      date: '10/09/2026',
      image: 'assets/images/cours-4.jpg'
    },
    {
      id: 5,
      titre: 'سورة الناس',
      description: 'حفظ سورة الناس مع تصحيح التلاوة.',
      professeur: 'الأستاذ محمد',
      date: '08/09/2026',
      image: 'assets/images/cours-5.jpg'
    },
    {
      id: 6,
      titre: 'سورة الفلق',
      description: 'شرح معاني سورة الفلق والتدرب على قراءتها.',
      professeur: 'الأستاذ أحمد',
      date: '05/09/2026',
      image: 'assets/images/cours-6.jpg'
    }
  ];

  selectedImage: string | null = null;

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;

    img.src = 'assets/images/default-course.jpg';
  }

  downloadCours(cours: any) {
    alert(`سيتم تحميل الدرس: ${cours.titre}`);
  }

  openCours(cours: any) {
    alert(`فتح الدرس: ${cours.titre}`);
  }

}