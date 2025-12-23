<script lang="ts">
import Column from 'primevue/column';
import TreeTable from 'primevue/treetable';
import { defineComponent, PropType } from 'vue';

export interface TreeNodeData {
    key: string;
    label: string;
    data?: Record<string, any>;
    children?: TreeNodeData[];
    leaf?: boolean;
}

export interface TreePagination {
    page: number;
    pageSize: number;
    total: number;
}

export default defineComponent({
    name: 'BaseTreeTable',
    components: {
        TreeTable,
        Column
    },
    props: {
        nodes: {
            type: Array as PropType<TreeNodeData[]>,
            required: true
        },
        loading: {
            type: Boolean,
            default: false
        },
        pagination: {
            type: Object as PropType<TreePagination>,
            required: true
        },
        rowsPerPageOptions: {
            type: Array as PropType<number[]>,
            default: () => [5, 10, 25, 50]
        }
    },
    emits: ['page'],
    setup(props, { emit }) {
        function onPage(event: any) {
            emit('page', {
                page: event.page + 1,
                pageSize: event.rows
            });
        }

        return {
            onPage
        };
    }
});
</script>

<template>
    <TreeTable
        :value="nodes"
        :lazy="true"
        :loading="loading"
        :paginator="true"
        :rows="pagination.pageSize"
        :totalRecords="pagination.total"
        :rowsPerPageOptions="rowsPerPageOptions"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        currentPageReportTemplate="{first} to {last} of {totalRecords}"
        tableStyle="min-width: 70rem"
        @page="onPage"
    >
        <slot />
    </TreeTable>
</template>
