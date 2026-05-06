<script setup lang="ts">
import { PhDotsThreeVertical, PhEye, PhCheck, PhX } from '@phosphor-icons/vue';
import { Order } from '@/types/request-order.type';
import type { ComponentPublicInstance } from 'vue';
import { computed, ref, markRaw } from 'vue';
import { ProTable, ProButton, ProTag } from '@prosync_solutions/ui';

type MenuInstance = ComponentPublicInstance & {
    toggle: (event: Event) => void;
};

const props = defineProps<{
    orders: Order[];
    getStatusSeverity: (status: string) => string;
    activeTab: string;
    isPurchasingRole: boolean;
}>();

const emit = defineEmits<{
    (e: 'view', order: Order): void;
    (e: 'approve', order: Order): void;
    (e: 'reject', order: Order): void;
}>();

const menu = ref<MenuInstance | null>(null);
const selectedOrder = ref<Order | null>(null);

function openMenu(event: Event, order: Order): void {
    selectedOrder.value = order;
    menu.value?.toggle(event);
}

const menuItems = computed(() => {
    const base = [
        {
            label: 'View',
            icon: markRaw(PhEye),
            command: () => {
                if (selectedOrder.value) {
                    emit('view', selectedOrder.value);
                }
            }
        }
    ];

    if (props.isPurchasingRole && selectedOrder.value?.status === 'Pending') {
        base.push(
            {
                label: 'Approve',
                icon: markRaw(PhCheck),
                command: () => {
                    if (selectedOrder.value) {
                        emit('approve', selectedOrder.value);
                    }
                }
            },
            {
                label: 'Reject',
                icon: markRaw(PhX),
                command: () => {
                    if (selectedOrder.value) {
                        emit('reject', selectedOrder.value);
                    }
                }
            }
        );
    }

    return base;
});

const tableColumns = computed(() => {
    return [
        { key: 'roNumber', label: 'RO Number', sortable: true },
        { key: 'requestedBy', label: 'Requested By', sortable: true },
        { key: 'roDate', label: 'RO Date', sortable: true },
        { key: 'deliveryDate', label: 'Delivery Date', sortable: true },
        { key: 'totalAmount', label: 'Total Amount', sortable: true },
        { key: 'budgetType', label: 'Budget Type', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'requestedAt', label: 'Requested At', sortable: true },
        { key: 'actions', label: '', actions: true }
    ];
});
</script>

<template>
    <ProTable :columns="tableColumns" :data="orders" searchable>
        <template #cell-status="{ row }">
            <ProTag :value="row.status" :severity="getStatusSeverity(row.status)" />
        </template>
        <template #cell-actions="{ row }">
            <ProButton variant="secondary" size="sm" @click="openMenu($event, row)">
                <PhDotsThreeVertical />
            </ProButton>
        </template>
    </ProTable>

    <Menu ref="menu" :model="menuItems" popup />
</template>

<style scoped>
/* Removed legacy custom-table DataTable overriding CSS */
</style>
