import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-mes-notifications',
  imports: [SidebarComponent],
  templateUrl: './mes-notifications.component.html',
  styleUrl: './mes-notifications.component.css'
})
export class MesNotificationsComponent {

  notifications = [

    {
      id: 1,
      type: 'payment',
      icon: '💳',
      title: 'تذكير بأداء الواجب الشهري',
      message: 'يرجى أداء الواجب الشهري لشهر أكتوبر قبل بداية الشهر الجديد.',
      date: '15/09/2026',
      unread: true
    },

    {
      id: 2,
      type: 'devoir',
      icon: '📝',
      title: 'واجب جديد',
      message: 'تمت إضافة واجب جديد في مادة أحكام التجويد.',
      date: '14/09/2026',
      unread: true
    },

    {
      id: 3,
      type: 'cours',
      icon: '📚',
      title: 'درس جديد',
      message: 'تمت إضافة درس جديد: سورة الإخلاص.',
      date: '12/09/2026',
      unread: false
    },

    {
      id: 4,
      type: 'presence',
      icon: '📅',
      title: 'الحضور',
      message: 'تم تسجيل حضورك في حصة اليوم.',
      date: '11/09/2026',
      unread: false
    }

  ];


  markAsRead(notification: any) {

    notification.unread = false;

  }


  markAllAsRead() {

    this.notifications.forEach(notification => {

      notification.unread = false;

    });

  }


  deleteNotification(notification: any) {

    const index =
      this.notifications.indexOf(notification);

    if (index !== -1) {

      this.notifications.splice(index, 1);

    }

  }

}