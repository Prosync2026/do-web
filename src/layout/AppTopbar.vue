<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/auth/auth.store';
import { useBudgetStore } from '@/stores/budget/budget.store';
import { useProjectStore } from '@/stores/project/project.store';
import { Motion } from '@motionone/vue';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Menu from 'primevue/menu';
import type { MenuItemCommandEvent } from 'primevue/menuitem';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const router = useRouter();
const authStore = useAuthStore();

watch(isDarkTheme, (dark) => {
    document.documentElement.classList.toggle('dark', dark);
});
/* ================= User Sign Out ================= */
const handleSignOut = () => {
    authStore.logout();
    router.push({ name: 'login' });
};

const profileMenu = ref([
    { label: 'Notification', icon: 'pi pi-bell', command: (event: MenuItemCommandEvent) => router.push('/notifications') },
    { label: 'Company', icon: 'pi pi-building', command: (event: MenuItemCommandEvent) => router.push('/companyList') },
    { separator: true },
    { label: computed(() => (isDarkTheme.value ? 'Light Mode' : 'Dark Mode')), icon: computed(() => (isDarkTheme.value ? 'pi pi-sun' : 'pi pi-moon')), command: () => toggleDarkMode() },
    { separator: true },
    { label: 'Sign Out', icon: 'pi pi-sign-out', command: handleSignOut }
]);

const profileMenuRef = ref();
const toggleProfileMenu = (event: Event) => {
    profileMenuRef.value.toggle(event);
};

/* ================= Username + Project Info ================= */
const username = ref<string | null>(null);
const showProjectDialog = ref(false);
const selectedProject = ref<{ company: string; name: string; ProjectId: number } | null>(null);

interface Project {
    id: number;
    ProjectId: number;
    name: string;
    status: 'Active' | 'Inactive';
    budget: string;
    system_company?: {
        name: string;
    };
}

interface CompanyGroup {
    company: string;
    projects: Project[];
}

const projectStore = useProjectStore();
const companyProjects = computed(() => projectStore.groupedProjects);

onMounted(() => {
    projectStore.fetchProjects();
});

const saveProjectToStorage = (project: { company: string; name: string; ProjectId: number } | null) => {
    try {
        if (project) {
            const dataToSave = {
                company: project.company,
                name: project.name,
                ProjectId: project.ProjectId
            };

            localStorage.setItem('selectedProject', JSON.stringify(dataToSave));
        } else {
            localStorage.removeItem('selectedProject');
        }
    } catch (error) {
        console.error('Error saving project to localStorage:', error);
    }
};

const loadProjectFromStorage = (): { company: string; name: string; ProjectId?: number } | null => {
    try {
        const stored = localStorage.getItem('selectedProject');

        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.company && parsed.name) {
                return parsed;
            }
        }
    } catch (error) {
        console.error('Error loading project from localStorage:', error);
    }
    return null;
};

watch(
    companyProjects,
    (groups) => {
        if (groups.length === 0) return;

        const storedProject = loadProjectFromStorage();

        if (storedProject) {
            let matchedProject: Project | null = null;
            let matchedCompany: string | null = null;

            outerLoop: for (const group of groups) {
                for (const project of group.projects) {
                    const projectId = project.ProjectId || project.id;
                    if (projectId === storedProject.ProjectId) {
                        matchedProject = project;
                        matchedCompany = project.system_company?.name || group.company;
                        break outerLoop;
                    }
                }
            }

            // Fallback: match by name
            if (!matchedProject) {
                outerLoop2: for (const group of groups) {
                    for (const project of group.projects) {
                        if (project.name === storedProject.name) {
                            matchedProject = project;
                            matchedCompany = project.system_company?.name || group.company;
                            break outerLoop2;
                        }
                    }
                }
            }

            if (matchedProject && matchedCompany) {
                const projectId = matchedProject.ProjectId || matchedProject.id;
                selectedProject.value = {
                    company: matchedCompany,
                    name: matchedProject.name,
                    ProjectId: projectId || 0
                };
            } else {
                // Default if no match found
                selectedProject.value = { company: 'Alunan Asas', name: 'MKT', ProjectId: 1 };
            }
        } else {
            selectedProject.value = { company: 'Alunan Asas', name: 'MKT', ProjectId: 1 };
        }
    },
    { immediate: true }
);

const showReloadSpinner = ref(false);

const selectProject = (company: string, project: Project) => {
    const projectId = project.ProjectId || project.id;
    const projectToSave = {
        company: project.system_company?.name || company,
        name: project.name,
        ProjectId: projectId || 0
    };

    saveProjectToStorage(projectToSave);

    selectedProject.value = projectToSave;
    showProjectDialog.value = false;

    showReloadSpinner.value = true;

    setTimeout(() => {
        window.location.reload();
    }, 300);
};

const saveLatestBudgetVersion = (version: number) => {
    try {
        localStorage.setItem('latestBudgetVersion', version.toString());
    } catch (err) {
        console.error('Error saving latest budget version to localStorage', err);
    }
};

onMounted(async () => {
    // Load username from auth store
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        username.value = user.username;
    }

    const budgetStore = useBudgetStore();
    const versions = await budgetStore.fetchBudgetVersion();
    if (versions && versions.length > 0) {
        const latest = versions.reduce((prev, curr) => (Number(curr.id) > Number(prev.id) ? curr : prev));
        saveLatestBudgetVersion(Number(latest.id));
    }
});
</script>

<template>
    <Motion tag="div" class="layout-topbar" :initial="{ y: -80, opacity: 0 }" :animate="{ y: 0, opacity: 1 }" :transition="{ duration: 0.8, ease: 'easeOut' }">
        <div class="flex items-center w-full h-full gap-4">
            <!-- LEFT: Menu button -->
            <div class="flex items-center gap-4">
                <button class="layout-menu-button layout-topbar-action p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" @click="toggleMenu">
                    <i class="pi pi-bars text-lg dark:text-white text-gray-700"></i>
                </button>
            </div>

            <!-- Project dropdown -->
            <div class="cursor-pointer border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2" @click="showProjectDialog = true">
                <i class="pi pi-briefcase text-sm text-gray-500 dark:text-gray-300"></i>
                <span class="text-gray-700 dark:text-gray-200 font-semibold text-sm hidden md:inline">
                    {{ selectedProject?.name || 'Select Project' }}
                </span>
                <i class="pi pi-chevron-down text-xs text-gray-500 dark:text-gray-400"></i>
            </div>

            <div class="ml-auto" style="padding-right: 3rem">
                <div class="layout-topbar-actions flex items-center gap-3 relative border-l border-gray-200 dark:border-gray-700 pl-4">
                    <!-- Desktop: show avatar + username -->
                    <div class="hidden lg:flex items-center gap-2">
                        <Button class="p-button-text p-button-plain p-button-sm flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-500 transition" @click="toggleProfileMenu">
                            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User Avatar" class="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600" />
                            <span class="font-medium">{{ username || 'PM User' }}</span>
                        </Button>
                    </div>

                    <!-- Mobile: show 3-dots button -->
                    <div class="flex lg:hidden items-center relative">
                        <Button ref="mobileProfileButtonRef" icon="pi pi-ellipsis-v" class="p-button-text p-button-plain p-button-lg text-gray-700 dark:text-gray-200 hover:text-blue-500" @click="toggleProfileMenu" />
                    </div>

                    <!-- Shared dropdown menu -->
                    <Menu ref="profileMenuRef" :model="profileMenu" popup class="w-56 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <!-- Profile header only on mobile -->
                        <template #start>
                            <div class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User Avatar" class="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600" />
                                <span class="font-semibold text-gray-800 dark:text-gray-100">
                                    {{ username || 'PM User' }}
                                </span>
                            </div>
                        </template>

                        <template #item="{ item }">
                            <Motion
                                tag="div"
                                class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                :initial="{ opacity: 0, y: 1 }"
                                :animate="{ opacity: 1, y: 0 }"
                                :transition="{ duration: 0.2, ease: 'easeOut' }"
                                @click="item.command && item.command($event)"
                            >
                                <i :class="item.icon" class="text-gray-600 dark:text-gray-300"></i>
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-100">
                                    {{ item.label }}
                                </span>
                            </Motion>
                        </template>
                    </Menu>
                    <Toast />
                </div>
            </div>
        </div>
    </Motion>
    <!-- Project Dialog -->
    <Dialog v-model:visible="showProjectDialog" header="Select Project" :style="{ width: '40rem', maxWidth: '90vw' }">
        <div v-for="group in companyProjects" :key="group.company" class="mb-6">
            <h3 class="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">{{ group.company }}</h3>
            <div class="space-y-3">
                <div
                    v-for="project in group.projects"
                    :key="`${group.company}-${project.name}`"
                    @click="selectProject(group.company, project)"
                    class="cursor-pointer border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    :class="{ 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600': selectedProject?.name === project.name && selectedProject?.company === group.company }"
                >
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-base font-bold text-gray-800 dark:text-gray-100">{{ project.name }}</span>
                        <Badge :value="project.status" :severity="project.status === 'Active' ? 'success' : 'contrast'" />
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Budget: {{ project.budget }}</p>
                </div>
            </div>
        </div>
    </Dialog>
    <div v-if="showReloadSpinner" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div class="flex flex-col items-center gap-4">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p class="text-white font-semibold">Loading project...</p>
        </div>
    </div>
</template>
