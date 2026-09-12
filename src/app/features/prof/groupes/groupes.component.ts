import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

export interface Groupe {
  id: string;
  nom: string;
  type: string;
  nb_etudiants?: number;
}

@Component({
  selector: 'app-groupes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './groupes.component.html',
  styleUrl: './groupes.component.css'
})
export class GroupesComponent implements OnInit {
  groupes = signal<Groupe[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  formLoading = signal<boolean>(false);

  showModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  modeEdit = signal<boolean>(false);

  groupeToDelete = signal<Groupe | null>(null);
  form = signal<{ id?: string; nom: string; type: string }>({ nom: '', type: 'رجال' });

  successMsg = signal<string>('');
  errorMsg = signal<string>('');

  constructor(private sb: SupabaseService) {}

  ngOnInit(): void {
    this.loadGroupes();
  }

  async loadGroupes(): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.sb.client
        .from('groupes')
        .select('*, profiles(count)')
        .order('nom');

      if (error) throw error;

      const formattedData = (data || []).map((g: any) => ({
        id: g.id,
        nom: g.nom,
        type: g.type || 'عام',
        nb_etudiants: g.profiles ? g.profiles[0]?.count || 0 : 0
      }));

      this.groupes.set(formattedData);
    } catch (err: any) {
      this.errorMsg.set(err.message || 'خطأ في تحميل المجموعات');
    } finally {
      this.loading.set(false);
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'رجال': return '👨';
      case 'نساء': return '👩';
      case 'أطفال': return '🧒';
      default: return '👥';
    }
  }

  getTypeBadge(type: string): string {
    switch (type) {
      case 'رجال': return 'badge-blue';
      case 'نساء': return 'badge-purple';
      case 'أطفال': return 'badge-green';
      default: return 'badge-gray';
    }
  }

  ouvrirAjout(): void {
    this.modeEdit.set(false);
    this.form.set({ nom: '', type: 'رجال' });
    this.errorMsg.set('');
    this.showModal.set(true);
  }

  ouvrirEdit(groupe: Groupe): void {
    this.modeEdit.set(true);
    this.form.set({ id: groupe.id, nom: groupe.nom, type: groupe.type });
    this.errorMsg.set('');
    this.showModal.set(true);
  }

  fermerModal(): void {
    this.showModal.set(false);
  }

  updateForm(field: string, value: string): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  async soumettre(): Promise<void> {
    const data = this.form();
    if (!data.nom.trim()) {
      this.errorMsg.set('الرجاء إدخال اسم المجموعة');
      return;
    }

    this.formLoading.set(true);
    this.errorMsg.set('');

    try {
      if (this.modeEdit()) {
        const { error } = await this.sb.client
          .from('groupes')
          .update({ nom: data.nom, type: data.type })
          .eq('id', data.id);

        if (error) throw error;
        this.successMsg.set('تم تعديل المجموعة بنجاح');
      } else {
        const { error } = await this.sb.client
          .from('groupes')
          .insert({ nom: data.nom, type: data.type });

        if (error) throw error;
        this.successMsg.set('تم إنشاء المجموعة بنجاح');
      }

      this.fermerModal();
      await this.loadGroupes();
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch (err: any) {
      this.errorMsg.set(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      this.formLoading.set(false);
    }
  }

  confirmerSuppression(groupe: Groupe): void {
    this.groupeToDelete.set(groupe);
    this.showDeleteModal.set(true);
  }

  async supprimerGroupe(): Promise<void> {
    const target = this.groupeToDelete();
    if (!target) return;

    this.formLoading.set(true);
    try {
      const { error } = await this.sb.client
        .from('groupes')
        .delete()
        .eq('id', target.id);

      if (error) throw error;

      this.successMsg.set('تم حذف المجموعة بنجاح');
      this.showDeleteModal.set(false);
      await this.loadGroupes();
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch (err: any) {
      this.errorMsg.set(err.message || 'تعذر حذف المجموعة');
    } finally {
      this.formLoading.set(false);
    }
  }
}