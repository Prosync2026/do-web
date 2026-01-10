<template>
    <div class="card">
        <ResultNotFound v-if="!treeData || treeData.length === 0" :message="emptyTitle" />

        <TreeTable
            v-else
            :value="treeData"
            :paginator="paginationEnabled"
            :rows="pagination.pageSize"
            :totalRecords="pagination.total"
            :rowsPerPageOptions="paginationOptions"
            :lazy="lazy"
            :first="(pagination.page - 1) * pagination.pageSize"
            @page="onPageChangeInternal"
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            tableStyle="min-width: 50rem"
        >
            <template #paginatorstart>
                <Button type="button" icon="pi pi-refresh" text @click="$emit('refresh')" />
            </template>

            <Column v-for="col in columns" :key="col.field" :field="col.field" :header="col.header" :expander="col.expander || false" :style="col.style">
                <template #body="{ node }">
                    <span v-if="col.formatCurrency"> RM {{ formatCurrency(node.data[col.field]) }} </span>
                    <span v-else :class="{ 'font-bold': col.boldIfChildren && node.children }">
                        {{ node.data[col.field] }}
                    </span>
                </template>
            </Column>

            <template #paginatorend>
                <Button type="button" icon="pi pi-download" text @click="$emit('download')" />
            </template>
        </TreeTable>
    </div>
</template>

<script lang="ts">
import ResultNotFound from '@/components/resulNotFound/ResultNotFound.vue';
import { formatCurrency } from '@/utils/format.utils';
import Button from 'primevue/button';
import Column from 'primevue/column';
import TreeTable from 'primevue/treetable';
import { defineComponent, PropType } from 'vue';

interface ColumnDef {
    field: string;
    header: string;
    expander?: boolean;
    style?: string;
    boldIfChildren?: boolean;
    formatCurrency?: boolean;
}

interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default defineComponent({
    name: 'BaseTreeTable',
    components: { TreeTable, Column, Button, ResultNotFound },
    props: {
        treeData: {
            type: Array as PropType<any[]>,
            default: () => []
        },
        columns: {
            type: Array as PropType<ColumnDef[]>,
            default: () => []
        },
        pagination: {
            type: Object as PropType<Pagination>,
            default: () => ({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
        },
        lazy: { type: Boolean, default: true },
        paginationEnabled: { type: Boolean, default: true },
        paginationOptions: {
            type: Array as PropType<number[]>,
            default: () => [5, 10, 25, 50]
        },
        emptyTitle: { type: String, default: 'No List Found' }
    },
    emits: ['page-change', 'refresh', 'download'],
    methods: {
        formatCurrency,
        onPageChangeInternal(event: { first: number; rows: number; page: number; pageCount: number }) {
            const nextPage = event.page + 1;
            const pageSize = event.rows;
            this.$emit('page-change', { page: nextPage, pageSize });
        }
    }
});
</script>
