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
            { field: 'name', header: 'Location 1/Location 2', expander: true, style: 'width: 40%', boldIfChildren: true },
            { field: 'itemCode', header: 'Item', style: 'width: 15%' },
            { field: 'description', header: 'Description', style: 'width: 30%' },
            { field: 'unit', header: 'UOM', style: 'width: 10%' },
            { field: 'quantity', header: 'Qty', style: 'width: 10%' },
            { field: 'rate', header: 'Rate', style: 'width: 10%' },
            { field: 'amount', header: 'Amount', style: 'width: 10%', formatCurrency: true }
        ];

        async function fetchTree({ page = 1, pageSize = 10 } = {}) {
            if (!budgetIdRef.value) return;

            const res: any = await budgetStore.fetchHierarchyBudgetLocation(budgetIdRef.value, page, pageSize);
            treeNodes.value = buildTree(res?.data || []);

            pagination.value.page = res?.pagination?.page || page;
            pagination.value.pageSize = res?.pagination?.pageSize || pageSize;
            pagination.value.total = res?.pagination?.total || treeNodes.value.length;
            pagination.value.totalPages = res?.pagination?.totalPages || 1;
        }

        function buildTree(apiData: any[]): any[] {
            return (apiData || []).map((loc1: any, i: number) => ({
                key: `loc1-${i}`,
                data: { name: loc1.location1, amount: loc1.totalAmount },
                children: (loc1.location2s || []).map((loc2: any, j: number) => ({
                    key: `loc2-${i}-${j}`,
                    data: { name: loc2.location2 },
                    children: (loc2.items || []).map((item: any, k: number) => ({
                        key: `item-${i}-${j}-${k}`,
                        data: {
                            itemCode: item.itemCode,
                            description: item.description,
                            unit: item.unit,
                            quantity: item.quantity,
                            rate: item.rate,
                            amount: item.amount
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
