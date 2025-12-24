import { projectService } from '@/services/project.service';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { Project } from '@/types/project.type';
import { showError } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useProjectStore = defineStore('project', () => {
    const projects = ref<Project[]>([]);
    const loading = ref(false);

    const groupedProjects = computed(() => {
        const groups: Record<string, any[]> = {};

        projects.value.forEach((p) => {
            const companyName = p.system_company?.name ?? 'Unknown Company';

            if (!groups[companyName]) groups[companyName] = [];

            groups[companyName].push({
                ProjectId: p.id,
                name: p.name,
                status: p.status === 'ACTIVE' ? 'Active' : 'Inactive',
                budget: p.contract_value ? `RM ${p.contract_value}` : 'RM 0'
            });
        });

        return Object.keys(groups).map((company) => ({
            company,
            projects: groups[company]
        }));
    });

    async function fetchProjects() {
        loading.value = true;
        try {
            const res = await projectService.getProjects();

            if (!res.success) {
                showError('Failed to load projects');
                return;
            }

            const authStore = useAuthStore();
            const userProjectId = authStore.user?.project_id;

            projects.value = userProjectId ? res.data.filter((p: any) => p.id === userProjectId) : [];
        } catch (error: any) {
            showError(error.message || 'Failed to load project list');
        } finally {
            loading.value = false;
        }
    }

    return {
        projects,
        groupedProjects,
        loading,
        fetchProjects
    };
});
