<script setup lang="ts">
import type { TableColumn } from '@/types/table.type';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Menu from 'primevue/menu';
import { computed, ref, watch } from 'vue';

import ResultNotFound from '@/components/resulNotFound/ResultNotFound.vue';
import BaseSpinner from '@/components/spinner/BaseSpinner.vue';
import type { DataTableSortEvent } from 'primevue/datatable';

type ActionType = 'edit' | 'view' | 'delete' | 'comment' | 'approve' | 'reject';

type FilterOption = {
    type: 'select' | 'text' | 'date';
    field: string;
    placeholder?: string;
    options?: { label: string; value: any }[];
};

interface TableRow {
    [key: string]: any;
    actions?: ActionType[];
}

interface PaginationConfig {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

const props = defineProps<{
    value: TableRow[];
    columns: TableColumn[];
    loading?: boolean;
    onSearch?: (value: string) => void;
    showCreate?: boolean;
    showImportFile?: boolean;
    onCreate?: () => void;
    onImportFile?: () => void;
    onRefresh?: () => void;
    onExport?: () => void;
    onActionClick?: (type: ActionType, rowData: TableRow, event?: Event) => void;
    emptyTitle?: string;
    extraFilters?: FilterOption[];
    onFilterChange?: (filters: Record<string, any>) => void;
    pagination?: PaginationConfig;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    selectionMode?: 'checkbox' | 'radio' | undefined;
    selection?: TableRow[];
    dataKey?: string;
    onSortChange?: (payload: { field: string; order: number }) => void;
    sortField?: string;
    sortOrder?: number;
}>();

const visibleColumns = computed(() => props.columns.filter((c) => c.visible !== false));

const emit = defineEmits<{
    'update:selection': [value: TableRow[]];
}>();

const search = ref('');
const activeFilters = ref<Record<string, any>>({});
const hasLoadedOnce = ref(false);

const menu = ref();
const currentRow = ref<TableRow | null>(null);
const menuItems = ref<any[]>([]);

const isServerSidePagination = computed(() => props.pagination !== undefined);

watch(
    () => props.value,
    (val) => {
        if (val && val.length > 0) {
            hasLoadedOnce.value = true;
        }
    },
    { immediate: true }
);

let searchTimeout: any;

function handleSearch() {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        props.onSearch?.(search.value);
    }, 400);
}

function handleExport() {
    props.onExport?.();
    if (!props.value || props.value.length === 0) return;

    const columns = props.columns.filter((c) => !c.action).map((c) => c.header);
    const rows = props.value.map((row) =>
        props.columns
            .filter((c) => !c.action)
            .map((c) => {
                if (c.exportFormatter) {
                    return `"${c.exportFormatter(row)}"`;
                }

                const value = row[c.field!];

                if (value === null || value === undefined) return '';

                if (typeof value === 'object') {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }

                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }

                return value;
            })

            .join(',')
    );

    const csvContent = [columns.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function openMenu(event: Event, row: TableRow, columnActions?: ActionType[] | ((row: TableRow) => ActionType[])) {
    let actions: ActionType[] = [];

    if (typeof columnActions === 'function') {
        actions = columnActions(row);
    } else if (Array.isArray(columnActions)) {
        actions = columnActions;
    } else if (Array.isArray(row.actions)) {
        actions = row.actions;
    }

    if (!actions.length) return;

    currentRow.value = row;

    menuItems.value = actions.map((actionType) => ({
        label: actionType.charAt(0).toUpperCase() + actionType.slice(1),
        icon: actionType === 'edit' ? 'pi pi-pencil' : actionType === 'view' ? 'pi pi-eye' : actionType === 'delete' ? 'pi pi-trash' : actionType === 'approve' ? 'pi pi-check-circle' : actionType === 'reject' ? 'pi pi-times-circle' : 'pi pi-comment',
        command: (menuEvent: Event) => props.onActionClick?.(actionType, currentRow.value!, menuEvent)
    }));

    menu.value.toggle(event);
}

function getPaginationNumbers(): number[] {
    if (!props.pagination) return [];

    const totalPages = props.pagination.totalPages || 1;
    const currentPage = props.pagination.page;
    const maxVisible = 5;
    const numbers: number[] = [];

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        numbers.push(i);
    }

    return numbers;
}

const displayStart = computed(() => {
    if (!props.pagination) return 0;
    return (props.pagination.page - 1) * props.pagination.pageSize + 1;
});

const displayEnd = computed(() => {
    if (!props.pagination) return 0;
    return Math.min(props.pagination.page * props.pagination.pageSize, props.pagination.total);
});

// Handle selection update from DataTable
const selectionProxy = computed({
    get: () => props.selection || [],
    set: (val) => emit('update:selection', val)
});

// sorting
function onSort(event: DataTableSortEvent) {
    console.log('onSort event:', {
        sortField: event.sortField,
        sortOrder: event.sortOrder,
        currentSortField: props.sortField,
        currentSortOrder: props.sortOrder
    });

    if (typeof event.sortField !== 'string') return;

    // Manual toggle logic for server-side sorting as PrimeVue dont only support client-side sorting
    let newOrder: number;

    if (event.sortField !== props.sortField) {
        // New column clicked - start with ASC
        newOrder = 1;
    } else {
        // Same column clicked - toggle
        if (props.sortOrder === 1) {
            newOrder = -1; // ASC → DESC
        } else if (props.sortOrder === -1) {
            // DESC → Reset
            props.onSortChange?.({
                field: '',
                order: 0
            });
            return;
        } else {
            newOrder = 1; // Reset → ASC
        }
    }

    props.onSortChange?.({
        field: event.sortField,
        order: newOrder
    });
}

function handleFilterChange(field: string, value: any) {
    activeFilters.value[field] = value;
    props.onFilterChange?.(activeFilters.value);
    props.onPageChange?.(1);
}
</script>

<template>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3 mt-8 sm:mt-8">
        <div v-if="isServerSidePagination && props.pagination" class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
            <Dropdown :modelValue="props.pagination.pageSize" @update:modelValue="props.onPageSizeChange?.($event)" :options="[10, 25, 50, 100]" class="w-30" />
        </div>

        <div class="flex gap-2 flex-wrap items-center">
            <span class="p-input-icon-left">
                <InputText v-if="props.onSearch && hasLoadedOnce" v-model="search" placeholder="Search..." @input="handleSearch" class="w-full sm:w-auto" />
            </span>

            <template v-for="(f, i) in props.extraFilters" :key="i">
                <InputText v-if="f.type === 'text'" :placeholder="f.placeholder" v-model="activeFilters[f.field]" @input="handleFilterChange(f.field, activeFilters[f.field])" />

                <Dropdown
                    v-else-if="f.type === 'select'"
                    :options="f.options"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="f.placeholder"
                    v-model="activeFilters[f.field]"
                    @change="handleFilterChange(f.field, activeFilters[f.field])"
                    class="min-w-[8rem]"
                />

                <Calendar v-else-if="f.type === 'date'" :placeholder="f.placeholder" v-model="activeFilters[f.field]" @input="handleFilterChange(f.field, activeFilters[f.field])" dateFormat="yy-mm-dd" class="min-w-[10rem]" />
            </template>

            <Button v-if="props.showCreate" label="Create" icon="pi pi-plus" @click="props.onCreate?.()" />
            <Button v-if="props.showImportFile" label="Import CSV" icon="pi pi-upload" @click="props.onImportFile?.()" />
        </div>
    </div>

    <div v-if="props.loading" class="flex justify-center py-10">
        <BaseSpinner />
    </div>

    <div v-else-if="!props.loading && (!props.value || props.value.length === 0)" class="flex justify-center py-10">
        <ResultNotFound :message="props.emptyTitle ?? 'No List Found'" />
    </div>

    <template v-else>
        <DataTable
            v-if="props.selectionMode"
            v-model:selection="selectionProxy"
            :value="props.value"
            class="overflow-hidden dark:text-white"
            tableStyle="min-width: 50rem"
            :selection-mode="props.selectionMode === 'checkbox' ? undefined : props.selectionMode"
            :data-key="props.dataKey || 'id'"
            :sortMode="'single'"
            :lazy="true"
            :removableSort="true"
            @sort="onSort"
            :sortField="props.sortField"
            :sortOrder="props.sortOrder"
        >
            <!-- Checkbox Column -->
            <Column v-if="props.selectionMode === 'checkbox'" selection-mode="multiple" style="width: 3rem" />

            <Column v-for="(col, idx) in visibleColumns" :key="col.field || idx" :field="col.field" :header="col.header" :sortable="col.sortable" :frozen="col.frozen" :style="col.style">
                <template v-if="col.bodySlot && !col.action" #body="slotProps">
                    <slot :name="col.bodySlot" :data="slotProps.data" />
                </template>

                <template v-else-if="col.body" #body="slotProps">
                    {{ col.body?.(slotProps.data) }}
                </template>

                <template v-else-if="col.action" #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-ellipsis-v" text @click="openMenu($event, slotProps.data, col.actions)" />
                    </div>
                </template>

                <template v-else #body="slotProps">
                    {{ col.field ? slotProps.data[col.field] : '' }}
                </template>
            </Column>
        </DataTable>

        <DataTable :sortMode="'single'" :lazy="true" @sort="onSort" :removableSort="true" v-else :value="props.value" class="overflow-hidden dark:text-white" tableStyle="min-width: 50rem" :data-key="props.dataKey || 'id'">
            <Column v-for="(col, idx) in visibleColumns" :key="col.field || idx" :field="col.field" :header="col.header" :sortable="col.sortable" :frozen="col.frozen" :style="col.style">
                <template v-if="col.bodySlot && !col.action" #body="slotProps">
                    <slot :name="col.bodySlot" :data="slotProps.data" />
                </template>

                <template v-else-if="col.body" #body="slotProps">
                    {{ col.body?.(slotProps.data) }}
                </template>

                <template v-else-if="col.action" #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-ellipsis-v" text @click="openMenu($event, slotProps.data, col.actions)" />
                    </div>
                </template>

                <template v-else #body="slotProps">
                    {{ col.field ? slotProps.data[col.field] : '' }}
                </template>
            </Column>
        </DataTable>

        <!-- Custom Pagination with Numbered Buttons -->
        <div v-if="isServerSidePagination && props.pagination" class="flex flex-col sm:flex-row items-center mt-4 px-4 py-3 border-t dark:border-gray-700 w-full">
            <div class="w-full sm:w-1/3 text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">Showing {{ displayStart }} – {{ displayEnd }} of {{ props.pagination.total }}</div>

            <div class="w-full sm:w-1/3 flex justify-center items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
                <Button icon="pi pi-angle-double-left" text :disabled="props.pagination.page === 1" @click="props.onPageChange?.(1)" title="First Page" />
                <Button icon="pi pi-angle-left" text :disabled="props.pagination.page === 1" @click="props.onPageChange?.(props.pagination.page - 1)" title="Previous Page" />

                <div class="flex gap-1">
                    <Button
                        v-for="pageNum in getPaginationNumbers()"
                        :key="pageNum"
                        :label="`${pageNum}`"
                        :severity="pageNum === props.pagination.page ? 'primary' : 'secondary'"
                        :text="pageNum !== props.pagination.page"
                        @click="props.onPageChange?.(pageNum)"
                        rounded
                        class="w-8 h-8 p-0 flex items-center justify-center text-xs"
                    />
                </div>

                <Button icon="pi pi-angle-right" text :disabled="props.pagination.page >= (props.pagination.totalPages || 1)" @click="props.onPageChange?.(props.pagination.page + 1)" title="Next Page" />
                <Button icon="pi pi-angle-double-right" text :disabled="props.pagination.page >= (props.pagination.totalPages || 1)" @click="props.onPageChange?.(props.pagination.totalPages || 1)" title="Last Page" />
            </div>

            <div class="w-full sm:w-1/3 flex justify-end mt-2 sm:mt-0">
                <Button type="button" icon="pi pi-download" text @click="handleExport" title="Export CSV" />
            </div>
        </div>
    </template>

    <Menu ref="menu" :model="menuItems" popup />
</template>
