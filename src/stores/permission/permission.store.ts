import { permissionService } from '@/services/permission.service';
import { showError } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from '../auth/auth.store';

export const usePermissionStore = defineStore('permission', () => {
    const permissions = ref<string[]>([]);
    const projectContext = ref<{
        projectId: number;
        projectName: string;
        roles: {
            roleId: number;
            roleName: string;
            permissions: string[];
        }[];
    } | null>(null);
    const loading = ref(false);

    async function fetchPermissions(projectId?: number) {
        loading.value = true;

        try {
            const res = await permissionService.getPermissions();
            const authStore = useAuthStore();

            if (!res.data || res.data.length === 0) {
                permissions.value = [];
                projectContext.value = null;
                return;
            }

            const collectedPermissions = new Set<string>();
            let matchedProjectContext: typeof projectContext.value = null;

            const userRoleId = authStore.user?.role_id;

            res.data.forEach((client) => {
                client.system_companies.forEach((company) => {
                    company.projects.forEach((project) => {
                        if (!projectId || project.project_id === projectId) {
                            // filter roles matching user's role id
                            const roles = project.roles
                                .filter((role) => role.project_role_id === userRoleId)
                                .map((role) => {
                                    role.project_role_system_permissions.forEach((p) => collectedPermissions.add(p));

                                    return {
                                        roleId: role.project_role_id,
                                        roleName: role.project_role_name,
                                        permissions: role.project_role_system_permissions
                                    };
                                });

                            if (roles.length > 0) {
                                matchedProjectContext = {
                                    projectId: project.project_id,
                                    projectName: project.project_name,
                                    roles
                                };
                            }
                        }
                    });
                });
            });

            permissions.value = Array.from(collectedPermissions);
            projectContext.value = matchedProjectContext;

            console.log('permissions', permissions.value);
            console.log('projectContext', projectContext.value);
        } catch (error: any) {
            showError(error.message || 'Failed to load permissions');
        } finally {
            loading.value = false;
        }
    }

    const hasPermission = (permission: string) => {
        return permissions.value.includes(permission);
    };

    return {
        permissions,
        loading,
        fetchPermissions,
        hasPermission
    };
});
