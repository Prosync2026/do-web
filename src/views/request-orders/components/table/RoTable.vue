<script setup lang="ts">
import { PhDotsThreeVertical } from '@phosphor-icons/vue';
import { Order } from '@/types/request-order.type';
import type { ComponentPublicInstance } from 'vue';
import { computed, ref } from 'vue';

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
</script>

<template>
    <DataTable :value="orders" class="custom-table" responsiveLayout="scroll">
        <template #empty>
            <div class="text-center text-gray-500 py-6">No request orders found</div>
        </template>

        <Column header="#" style="width: 50px">
            <template #body="slotProps">
                {{ slotProps.index + 1 }}
            </template>
        </Column>

        <Column field="roNumber" header="RO Number"></Column>
        <Column field="requestedBy" header="Requested By"></Column>
        <Column field="roDate" header="RO Date"></Column>
        <Column field="deliveryDate" header="Delivery Date"></Column>
        <Column field="totalAmount" header="Total Amount"></Column>
        <Column field="budgetType" header="Budget Type"></Column>
        <Column field="status" header="Status">
            <template #body="{ data }: { data: Order }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
        </Column>
        <Column field="requestedAt" header="Requested At"></Column>

        <Column header="Action" style="width: 80px">
            <template #body="{ data }: { data: Order }">
                <Button text @click="openMenu($event, data)" ><template #icon><PhDotsThreeVertical class="mr-2" /></template></Button>
            </template>
        </Column>
    </DataTable>

    <Menu ref="menu" :model="menuItems" popup />
</template>

<style scoped>
.custom-table :deep(.p-datatable-table) {
    min-width: 100%;
    font-size: 0.875rem;
    text-align: left;
}

.custom-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.5rem 1rem;
    border: none;
    border-bottom: 1px solid #e5e7eb;
    background: transparent;
    font-weight: normal;
    color: #6b7280;
}

.custom-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 1rem;
    border: none;
    border-bottom: 1px solid #e5e7eb;
}

.custom-table :deep(.p-datatable-tbody > tr) {
    border: none;
}

.custom-table :deep(.p-datatable-tbody > tr:hover) {
    background-color: #f9fafb;
}

.custom-table :deep(.p-datatable-tbody > tr:last-child > td) {
    border-bottom: none;
}

:global(.dark) .custom-table :deep(.p-datatable-thead > tr > th) {
    color: white;
    border-bottom-color: #374151;
}

:global(.dark) .custom-table :deep(.p-datatable-tbody > tr > td) {
    border-bottom-color: #374151;
}

:global(.dark) .custom-table :deep(.p-datatable-tbody > tr:hover) {
    background-color: #1f2937;
}
</style>
