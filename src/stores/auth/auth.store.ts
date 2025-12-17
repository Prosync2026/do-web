import { authService } from '@/services/auth.service';
import type { AuthState, User } from '@/types/auth.type';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        token: localStorage.getItem('token') || null,
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
        isLoading: false
    }),

    getters: {
        isAuthenticated: (state): boolean => !!state.token,
        userRole: (state): string | null => state.user?.role || null,
        userName: (state): string | null => state.user?.username || null
    },

    actions: {
        async login(username: string, password: string, useAPI = true): Promise<boolean> {
            this.isLoading = true;

            try {
                if (useAPI) {
                    const response = await authService.login(username, password);
                    const { token, user } = response.data || {};
                    if (!token) return false;

                    this.setToken(token);
                    this.setUser({
                        id: user.id,
                        username: user?.Username || username,
                        role: user?.project_member_system_user[0].project_member?.project_role?.name,
                        role_id: user?.project_member_system_user[0].project_member?.project_role_id,
                        access_level: user?.client_management_group_system_user[0]?.access_level.code,
                        project_id: user.project_member_system_user[0].project_member.project_id,
                        user_project_role_code: user?.project_member_system_user[0].project_member?.project_role?.code,
                        email: user?.email
                    });
                    return true;
                } else {
                    return false;
                }
            } catch (err) {
                console.error(err);
                return false;
            } finally {
                this.isLoading = false;
            }
        },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },

        setToken(token: string) {
            this.token = token;
            localStorage.setItem('token', token);
        },

        setUser(user: User) {
            this.user = user;
            localStorage.setItem('user', JSON.stringify(user));
        }
    }
});
