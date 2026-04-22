<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/auth/auth.store';
import { useBudgetStore } from '@/stores/budget/budget.store';
import { useNotificationStore } from '@/stores/notification/notification.store';
import { usePermissionStore } from '@/stores/permission/permission.store';
import { useProjectStore } from '@/stores/project/project.store';
import type { Project } from '@/types';
import { getRouteByDocumentType } from '@/utils/route-map.util';
import { Motion } from '@motionone/vue';
import { PhBell, PhBriefcase, PhCaretDown, PhGear, PhSignOut } from '@phosphor-icons/vue';
import { ProButton, ProModal, ProTag, ProTopbar } from '@prosync_solutions/ui';
import Badge from 'primevue/badge';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const router = useRouter();
const authStore = useAuthStore();

// for PURC view
const userRoleCode = computed(() => authStore.user?.user_project_role_code);
const showProjectSelector = computed(() => userRoleCode.value !== 'PURC');

const permissionStore = usePermissionStore();

watch(isDarkTheme, (dark) => {
    document.documentElement.classList.toggle('dark', dark);
});
/* ================= User Sign Out ================= */
const handleSignOut = () => {
    authStore.logout();
    router.push({ name: 'login' });
};

// Dynamic profile menu based on roles
const profileMenu = computed(() => {
    const items = [];
    if (userRoleCode.value === 'SSA') {
        items.push({
            label: 'Settings',
            icon: 'pi pi-cog',
            command: () => router.push('/settings')
        });
        items.push({ separator: true });
    }

    items.push({ label: 'Sign Out', icon: 'pi pi-sign-out', command: handleSignOut });

    return items;
});

const profileMenuRef = ref();
const toggleProfileMenu = (event: Event) => {
    profileMenuRef.value.toggle(event);
};

/* ================= Username + Project Info ================= */
const username = ref<string | null>(null);
const showProjectDialog = ref(false);
const selectedProject = ref<{ company: string; name: string; ProjectId: number } | null>(null);

// notification
const notificationStore = useNotificationStore();
const showNotificationDropdown = ref(false);
const toggleNotificationMenu = () => {
    showNotificationDropdown.value = !showNotificationDropdown.value;
};

const goToPageDetails = async (item: any) => {
    try {
        await notificationStore.markNotificationAsRead(item.id);

        const route = getRouteByDocumentType(item.documentType);

        showNotificationDropdown.value = false;

        if (route) {
            router.push(route);
        }
    } catch (err) {
        console.error('Notification click failed:', err);
    }
};

const projectStore = useProjectStore();
const companyProjects = computed(() => projectStore.groupedProjects);

onMounted(() => {
    projectStore.fetchProjects();
    notificationStore.fetchUnreadNotifications();
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
        if (!groups || groups.length === 0) return;

        const storedProject = loadProjectFromStorage();

        let matchedProject: any | null = null;
        let matchedCompany: string | null = null;

        if (storedProject) {
            outer: for (const group of groups) {
                for (const project of group.projects) {
                    const projectId = project.ProjectId || project.id;
                    if (projectId === storedProject.ProjectId) {
                        matchedProject = project;
                        matchedCompany = group.company;
                        break outer;
                    }
                }
            }

            if (!matchedProject) {
                outer2: for (const group of groups) {
                    for (const project of group.projects) {
                        if (project.name === storedProject.name) {
                            matchedProject = project;
                            matchedCompany = group.company;
                            break outer2;
                        }
                    }
                }
            }
        }

        if (matchedProject && matchedCompany) {
            const projectId = matchedProject.ProjectId || matchedProject.id;

            selectedProject.value = {
                company: matchedCompany,
                name: matchedProject.name,
                ProjectId: projectId
            };
            permissionStore.fetchPermissions(projectId);
        } else {
            selectedProject.value = null;

            toast.add({
                severity: 'warn',
                summary: 'Project Required',
                detail: 'Please select a project before continuing.',
                life: 3000
            });
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
    // permissions immediately
    permissionStore.fetchPermissions(projectId);

    setTimeout(() => {
        window.location.reload();
    }, 300);
};

const saveLatestBudgetVersion = (versionId: number, versionCode?: number) => {
    try {
        // Save both ID (for retrieval) and code (for display)
        localStorage.setItem('selectedBudgetVersionId', versionId.toString());
        if (versionCode) {
            localStorage.setItem('selectedBudgetVersionCode', versionCode.toString());
        }
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
        // Save version ID for later retrieval
        saveLatestBudgetVersion(Number(latest.id), Number(latest.versionCode));
    }
});

// notification navigation
const goToAllNotifications = () => {
    showNotificationDropdown.value = false;
    router.push({ name: 'notifications' });
};
</script>

<template>
    <Motion tag="div" class="w-full relative z-50" :initial="{ y: -80, opacity: 0 }" :animate="{ y: 0, opacity: 1 }" :transition="{ duration: 0.8, ease: 'easeOut' }">
        <ProTopbar 
            :user-name="username || 'PM User'" 
            :user-avatar="'https://randomuser.me/api/portraits/women/44.jpg'"
            :user-email="authStore.user?.email"
            :user-staff-code="authStore.user?.employee_id?.toString()"
            :user-role="userRoleCode || 'Project Director'"
            @logout="handleSignOut"
        >
            <template #left>
                <!-- Project dropdown (Moved to left slot) -->
                <div
                    v-if="showProjectSelector"
                    class="cursor-pointer bg-white dark:bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 border border-gray-200 dark:border-gray-700"
                    @click="showProjectDialog = true"
                >
                    <PhBriefcase :size="16" class="text-gray-500 dark:text-gray-300" />
                    <span class="text-gray-700 dark:text-gray-200 font-semibold text-sm hidden md:inline">
                        {{ selectedProject?.name || 'Select Project' }}
                    </span>
                    <PhCaretDown :size="14" class="text-gray-500 dark:text-gray-400" />
                </div>
            </template>

            <template #right>
                <!-- Notifications (Moved to right slot before user menu) -->
                <div class="relative mr-2 flex items-center justify-center">
                    <button class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative" @click="toggleNotificationMenu">
                        <PhBell :size="20" class="text-gray-600 dark:text-gray-300" />
                    </button>
                    <Badge v-if="notificationStore.unreadCount > 0" :value="notificationStore.unreadCount" severity="danger" class="notification-badge absolute shadow-sm pointer-events-none" style="top: -2px; right: -4px; transform: scale(0.75); transform-origin: top right" />

                    <!-- Notification Dropdown -->
                    <Transition
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-150 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 translate-y-1"
                    >
                        <div v-if="showNotificationDropdown" class="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-border-border z-50 overflow-hidden">
                            <!-- Header -->
                            <div class="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                <span class="font-semibold text-gray-800 dark:text-white">Notifications</span>
                                <ProTag v-if="notificationStore.unreadCount > 0" variant="error">{{ notificationStore.unreadCount }}</ProTag>
                            </div>

                            <!-- Empty State -->
                            <div v-if="notificationStore.notifications.length === 0" class="text-sm text-gray-400 py-8 text-center">
                                <PhBell :size="32" class="mx-auto mb-2 text-gray-300" />
                                No notifications
                            </div>

                            <!-- Notification Items -->
                            <div v-else class="max-h-80 overflow-y-auto">
                                <div
                                    v-for="item in notificationStore.notifications"
                                    :key="item.id"
                                    :class="['px-4 py-3 cursor-pointer transition border-b border-gray-50 dark:border-gray-800', item.isRead ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30']"
                                    @click="goToPageDetails(item)"
                                >
                                    <div class="flex justify-between items-start gap-2">
                                        <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ item.title }}</span>
                                        <ProTag :variant="item.isRead ? 'secondary' : 'info'" class="text-[10px] shrink-0">{{ item.isRead ? 'Read' : 'Unread' }}</ProTag>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1.5 leading-relaxed">{{ item.message }}</p>
                                </div>
                            </div>

                            <!-- View All Footer -->
                            <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-center">
                                <ProButton variant="ghost" @click="goToAllNotifications" class="w-full text-sm font-semibold">View All Notifications</ProButton>
                            </div>
                        </div>
                    </Transition>
                </div>
            </template>
        </ProTopbar>
    </Motion>

    <!-- Click-outside overlay for notifications -->
    <Teleport to="body">
        <div v-if="showNotificationDropdown" class="fixed inset-0 z-[49]" @click="showNotificationDropdown = false"></div>
    </Teleport>

    <!-- Project Dialog -->
    <ProModal v-if="showProjectSelector" v-model="showProjectDialog" title="Select Project" size="md" class="z-[100]">
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
                        <ProTag :variant="project.status === 'Active' ? 'success' : 'secondary'">{{ project.status }}</ProTag>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Budget: {{ project.budget }}</p>
                </div>
            </div>
        </div>
    </ProModal>
    <div v-if="showReloadSpinner" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            <p class="text-white font-semibold">Loading project...</p>
        </div>
    </div>
</template>

<style>
/* 
 * FIX: The UI Library's ProTopbar natively uses Tailwind v4 primary gradient classes and text-error classes 
 * for its beautiful profile header and logout button. Because DO System is running Tailwind v3 config misses these definitions
 * the banner was silently falling back to a plain white background & grey text. 
 * Defining them explicitly restores the gorgeous native Storybook graphics automatically! 
 */
.from-brand-primary, .bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--color-brand-primary, #03439a), var(--color-brand-primary-strong, #02367b)) !important;
  /* Tailwind variable fallbacks just in case */
  --tw-gradient-from: var(--color-brand-primary, #03439a) var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(3 67 154 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.to-brand-primary-strong {
  --tw-gradient-to: var(--color-brand-primary-strong, #02367b) var(--tw-gradient-to-position);
}
.text-text-error {
  color: #dc2626 !important;
}
.hover\:bg-surface-error:hover {
  background-color: #fee2e2 !important;
}
</style>
