import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<any>(null);

  constructor(private sb: SupabaseService, private router: Router) {
    this.sb.client.auth.onAuthStateChange((event, session)=>{
      if(session?.user){
        this.loadProfile(session.user.id);
      } else {
        this.currentUser.set(null);
      }
    });
   }

    async login(email: string, password: string) {
    const { data, error } = await this.sb.client.auth
      .signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

   async register(email: string, password: string, profile: any) {
    const { data, error } = await this.sb.client.auth
      .signUp({ email, password });
    if (error) throw error;

    // إضافة بيانات الملف الشخصي
    if (data.user) {
      await this.sb.client.from('profiles').insert({
        id: data.user.id,
        ...profile
      });
    }
    return data;
  }

  // تسجيل الخروج
  async logout() {
    await this.sb.client.auth.signOut();
    this.router.navigate(['/login']);
  }

  // جلب الملف الشخصي
  async loadProfile(userId: string) {
    const { data } = await this.sb.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    this.currentUser.set(data);
  }

  get role() {
    return this.currentUser()?.role;
  }
}
