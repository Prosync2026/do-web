<script setup lang="ts">
import { useNavigation, type BottomNavItem } from './composables/useNavigation';
import { computed, ref, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PhHouse, PhChartBar, PhBook, PhTruck, PhTag, PhTicket } from '@phosphor-icons/vue';
import CartWithBadge from '@/components/icons/CartWithBadge.vue';
import { ProBottomNav, ProActionMenu } from '@prosync_solutions/ui';

const route = useRoute();
const router = useRouter();
const { canViewRO, canViewBudget, canViewPO, canViewDelivery } = useNavigation();

const showBudgetDrawer = ref(false);

const bottomNavItems = computed<BottomNavItem[]>(() => {
    return [
        { label: 'Dashboard', icon: markRaw(PhHouse), to: '/' },
        { 
            label: 'Budget', 
            icon: markRaw(PhChartBar), 
            to: '/_budget_drawer',
            visible: false, // Temporarily hidden as per user request
            onClick: (e?: Event) => {
                e?.preventDefault();
                showBudgetDrawer.value = true;
            }
        },
        { 
            label: 'ROs', 
            icon: markRaw(CartWithBadge), 
            to: '/request-orders', 
            visible: canViewRO.value 
        },
        { 
            label: 'POs', 
            icon: markRaw(PhBook), 
            to: '/purchase-orders', 
            visible: canViewPO.value 
        },
        { 
            label: 'Deliveries', 
            icon: markRaw(PhTruck), 
            to: '/deliveries', 
            visible: canViewDelivery.value 
        }
    ].filter(item => item.visible !== false).map(({ visible, ...rest }) => rest).slice(0, 5);
});

const resolvedActivePath = computed(() => {
    if (route.path.startsWith('/bcr') || route.path.startsWith('/budget')) {
        return '/_budget_drawer';
    }
    return route.path;
});

const handleNavigate = (path: string) => {
    showBudgetDrawer.value = false;
    router.push(path);
};
</script>

<template>
    <div class="block lg:hidden">
        <!-- Budget Sub-menu Drawer -->
        <Teleport to="body">
            <!-- Backdrop -->
            <Transition
                enter-active-class="transition-opacity duration-300"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div v-if="showBudgetDrawer" class="fixed inset-0 bg-black/60 z-[9998]" @click="showBudgetDrawer = false"></div>
            </Transition>

            <!-- Bottom Sheet -->
            <Transition
                enter-active-class="transition-transform duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)"
                enter-from-class="translate-y-full"
                enter-to-class="translate-y-0"
                leave-active-class="transition-transform duration-200 ease-in"
                leave-from-class="translate-y-0"
                leave-to-class="translate-y-full"
            >
                <div v-if="showBudgetDrawer" class="fixed inset-x-0 bottom-0 z-[9999] bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
                    <!-- Drag handle / Header -->
                    <div class="flex justify-center p-4 pb-2" @click="showBudgetDrawer = false">
                        <div class="w-12 h-1.5 bg-gray-200 hover:bg-gray-300 rounded-full cursor-pointer transition-colors"></div>
                    </div>
                    
                    <div class="px-6 pb-24">
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Budget Options</h3>
                        <div class="flex flex-col gap-3 pb-8">
                            <button 
                                @click="handleNavigate('/budget')"
                                class="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border border-gray-100"
                            >
                                <div class="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                                    <PhTicket :size="24" weight="fill" />
                                </div>
                                <div>
                                    <div class="font-bold text-gray-900">Budget List</div>
                                    <div class="text-sm text-gray-500 mt-0.5">View and manage all budgets</div>
                                </div>
                            </button>

                            <button 
                                @click="handleNavigate('/bcr')"
                                class="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border border-gray-100"
                            >
                                <div class="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                                    <PhTag :size="24" weight="fill" />
                                </div>
                                <div>
                                    <div class="font-bold text-gray-900">Budget Change Request</div>
                                    <div class="text-sm text-gray-500 mt-0.5">Manage BCR approvals</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Main Bottom Nav -->
        <ProBottomNav :items="bottomNavItems" :active-path="resolvedActivePath" class="z-[60]" />
    </div>
</template>
