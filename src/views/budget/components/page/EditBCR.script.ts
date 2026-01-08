import { useBudgetStore } from '@/stores/budget/budget.store';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BudgetChangeItem, BudgetChangeRequest, BudgetChangeRequestPayload } from '@/types/budgetChangeRequest.type';
import { formatDateToAPI } from '@/utils/dateHelper';
import { storeToRefs } from 'pinia';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';

export default defineComponent({
    name: 'EditBCR',
    components: { InputText, Calendar, Dropdown, Button, DataTable, Column },
    setup() {
        const router = useRouter();
        const route = useRoute();

        const budgetCRStore = useBudgetChangeRequestStore();
        const { singleBudgetChangeRequest, loading } = storeToRefs(budgetCRStore);

        const budgetStore = useBudgetStore();

        const roNumber = ref('');
        const requestBy = ref('');
        const requestDate = ref<Date | null>(null);
        const reason = ref('');
        const remark = ref('');
        const items = ref<any[]>([]);

        const reasonOptions = ref([
            { label: 'Exceed Budget', value: 'Exceed Budget' },
            { label: 'Mockup Remeasurement', value: 'Mockup Remeasurement' },
            { label: 'QS remeasurement', value: 'QS remeasurement' },
            { label: 'VO', value: 'VO' },
            { label: 'Others', value: 'Others' }
        ]);

        const allBudgetItems = computed(() => budgetStore.budgetItems);

        const fetchBudgetItems = async () => {
            const version = Number(localStorage.getItem('latestBudgetVersion'));
            if (!version) return;

            loading.value = true;
            try {
                await budgetStore.fetchBudgetItems({
                    budgetId: version,
                    page: 1,
                    pageSize: 1000
                });
            } catch (err) {
                console.error('Failed to fetch budget items:', err);
            } finally {
                loading.value = false;
            }
        };

        onMounted(async () => {
            const id = Number(route.params.id ?? route.params.budgetChangeRequestId ?? 0);
            if (!id) return;

            await budgetCRStore.getSingleBudgetChange(id);

            if (singleBudgetChangeRequest.value) {
                const s = singleBudgetChangeRequest.value as BudgetChangeRequest;
                roNumber.value = s.DocNo ?? '';
                requestBy.value = s.RequestedBy ?? '';
                requestDate.value = s.RequestDate ? new Date(s.RequestDate) : null;
                reason.value = s.Reason ?? '';
                remark.value = s.Remark ?? '';

                items.value = (s.budget_change_items ?? []).map((x) => ({
                    Id: x.Id ?? 0,
                    BudgetChangeId: x.BudgetChangeId ?? 0,
                    BudgetItemId: x.BudgetItemId ?? 0,
                    ItemCode: x.ItemCode ?? '',
                    Uom: x.Uom ?? '',
                    UnitPrice: x.UnitPrice ?? '0',
                    OrderedQty: x.OrderedQty ?? '0',
                    NewOrder: x.NewOrder ?? '0',
                    ExceededQty: x.ExceededQty ?? '0',
                    Description: x.Description ?? '',
                    Remark: x.Remark ?? '',
                    CreatedAt: x.CreatedAt ?? '',
                    CreatedBy: x.CreatedBy ?? null,
                    UpdatedAt: x.UpdatedAt ?? '',
                    UpdatedBy: x.UpdatedBy ?? null,
                    location: x.location ?? '',
                    element: x.element ?? ''
                }));

                await fetchBudgetItems();
            }
        });
        const fillSelectedItem = (item: BudgetChangeItem) => {
            const opt = allBudgetItems.value.find((b: any) => b.itemCode === item.ItemCode);
            console.log('opt', opt);
            if (opt) {
                item.Description = opt.description;
                item.Uom = opt.uom ?? '';
                item.UnitPrice = opt.amount;
                item.Remark = opt.remark ?? '';
                item.BudgetQty = opt.budgetQty;
                item.OrderedQty = opt.totalOrderedQty ?? '';
                item.NewOrder = opt.totalRequestedQty ?? '';
            }
        };

        const calcExceedQty = (it: BudgetChangeItem): number => Number(it.NewOrder || 0) - Number(it.OrderedQty || 0);
        const calcExceedPercent = (it: BudgetChangeItem): number => {
            const ordered = Number(it.OrderedQty) || 0;
            if (ordered === 0) return 0;
            return (calcExceedQty(it) / ordered) * 100;
        };
        const calcEstimatedExceed = (it: BudgetChangeItem): number => Number(it.UnitPrice || 0) * calcExceedQty(it);

        const totalVarianceAmount = computed(() => items.value.reduce((acc, it) => acc + calcEstimatedExceed(it), 0));

        const getColorClass = (val: number): string => {
            if (val > 0) return 'text-red-600 font-bold';
            if (val < 0) return 'text-green-600 font-bold';
            return 'text-gray-700';
        };

        const submitRequest = async () => {
            const payload: BudgetChangeRequestPayload = {
                ProjectId: singleBudgetChangeRequest.value?.ProjectId ?? 0,
                RequestDate: requestDate.value ? formatDateToAPI(requestDate.value) : '',
                RequestedBy: requestBy.value,
                Reason: reason.value,
                Department: singleBudgetChangeRequest.value?.Department ?? '',
                Remark: remark.value,
                TotalAmount: totalVarianceAmount.value,
                Type: 'BudgetChangeRequest',
                Items: items.value.map((i) => ({
                    BudgetItemId: i.BudgetItemId,
                    ItemCode: i.ItemCode,
                    ItemType: 'ExistingItem',
                    Uom: i.Uom,
                    UnitPrice: Number(i.UnitPrice),
                    OrderedQty: Number(i.OrderedQty),
                    NewOrder: Number(i.NewOrder),
                    Description: i.Description,
                    Remark: i.Remark,
                    Location1: i.location1 || '',
                    Location2: i.location2 || '',
                    Element: i.element || '',
                    SubEelement: i.subElement || '',
                    SubSubElement: i.subsubElement || '',
                    Category: i.category || '',
                    Wastage: i.wastage,
                    ExceededQty: calcExceedQty(i)
                }))
            };

            console.log('budgetChangeItem', payload);
            const isSuccess = await budgetCRStore.editBudgetChangeRequest(payload, singleBudgetChangeRequest.value?.Id ?? 0);
            if (isSuccess) router.push('/bcr');
        };

        return {
            loading,
            roNumber,
            requestBy,
            requestDate,
            reason,
            reasonOptions,
            remark,
            items,
            totalVarianceAmount,
            allBudgetItems,
            fillSelectedItem,
            calcExceedQty,
            calcExceedPercent,
            calcEstimatedExceed,
            getColorClass,
            submitRequest,
            goBack: () => router.push('/bcr')
        };
    }
});
