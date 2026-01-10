<template>
    <div>
        <BaseTreeTable :treeData="treeNodes" :columns="columns" :pagination="pagination" @page-change="fetchTree" @refresh="refreshTree" />
    </div>
</template>

<script lang="ts">
import BaseTreeTable from '@/components/table/ReusableTreeTable.vue';
import { useBudgetStore } from '@/stores/budget/budget.store';
import { defineComponent, onMounted, ref, toRef, watch } from 'vue';

export default defineComponent({
    name: 'BudgetView',
    components: { BaseTreeTable },
    props: {
        budgetId: {
            type: Number,
            required: true
        }
    },
    setup(props) {
        const budgetStore = useBudgetStore();

        const budgetIdRef = toRef(props, 'budgetId');
        const treeNodes = ref<any[]>([]);

        const pagination = ref({
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 1
        });

        const columns = [
            { field: 'name', header: 'Item Code / Description', expander: true, style: 'width: 40%', boldIfChildren: true },
            { field: 'location1', header: 'Location 1', style: 'width: 15%' },
            { field: 'location2', header: 'Location 2', style: 'width: 15%' },
            { field: 'element', header: 'Element', style: 'width: 15%' },
            { field: 'subElement', header: '1st Sub Element', style: 'width: 15%' },
            { field: 'subSubElement', header: '2nd Sub Element', style: 'width: 15%' },
            { field: 'unit', header: 'UOM', style: 'width: 10%' },
            { field: 'quantity', header: 'Qty', style: 'width: 10%' },
            { field: 'rate', header: 'Rate', style: 'width: 10%' },
            { field: 'amount', header: 'Amount', style: 'width: 10%', formatCurrency: true }
        ];

        async function fetchTree({ page = 1, pageSize = 10 } = {}) {
            if (!budgetIdRef.value) return;

            const res: any = await budgetStore.fetchHierarchyBudgetItems(budgetIdRef.value, page, pageSize);
            treeNodes.value = buildTree(res?.data || []);

            pagination.value.page = res?.pagination?.page || page;
            pagination.value.pageSize = res?.pagination?.pageSize || pageSize;
            pagination.value.total = res?.pagination?.total || treeNodes.value.length;
            pagination.value.totalPages = res?.pagination?.totalPages || 1;
        }

        function buildTree(apiData: any[]): any[] {
            return (apiData || []).map((item: any, i: number) => ({
                key: `item-${i}`,
                data: { name: item.itemCode },
                children: (item.descriptions || []).map((desc: any, d: number) => ({
                    key: `desc-${i}-${d}`,
                    data: { name: desc.description },
                    children: (desc.items || []).map((detail: any, x: number) => ({
                        key: `detail-${i}-${d}-${x}`,
                        data: {
                            location1: detail.location1,
                            location2: detail.location2,
                            element: detail.element,
                            subElement: detail.subElement,
                            subSubElement: detail.subSubElement,
                            unit: detail.unit,
                            quantity: detail.quantity,
                            rate: detail.rate,
                            amount: detail.amount
                        }
                    }))
                }))
            }));
        }

        function refreshTree() {
            fetchTree({ page: pagination.value.page, pageSize: pagination.value.pageSize });
        }

        watch(
            budgetIdRef,
            () => {
                fetchTree({ page: 1, pageSize: pagination.value.pageSize });
            },
            { immediate: true }
        );

        onMounted(() => {
            fetchTree({ page: 1, pageSize: pagination.value.pageSize });
        });

        return { treeNodes, columns, pagination, fetchTree, refreshTree };
    }
});
</script>
