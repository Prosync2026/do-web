// CreateBCR.script.ts
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRTableItem, BudgetChangeItemPayload, BudgetChangeRequestPayload } from '@/types/budgetChangeRequest.type';
import { getCurrentProjectId, getCurrentProjectName } from '@/utils/contextHelper';
import MeterialModal from '@/views/budget/components/dialog/CreateBCRModal.vue';
import { Motion } from '@motionone/vue';
import { useToast } from 'primevue';
import { computed, defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'CreateBCR',
    components: { Motion, MeterialModal },
    setup() {
        const router = useRouter();
        const budgetCRStore = useBudgetChangeRequestStore();

        // --- Header ---
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const requestBy = ref(localUser.username || '');
        const department = ref(localUser.role || '');
        const today = new Date();
        const requestDate = ref(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
        const selectedReason = ref<string | null>(null);
        const remarks = ref('');
        const projectName = getCurrentProjectName();
        const showValidation = ref(false);
        const toast = useToast();
        // --- Reason Options ---
        const reasonOptions = ref([
            { label: 'Exceed Budget', value: 'Exceed Budget' },
            { label: 'Mockup Remeasurement', value: 'Mockup Remeasurement' },
            { label: 'QS remeasurement', value: 'QS remeasurement' },
            { label: 'VO', value: 'VO' },
            { label: 'Others', value: 'Others' }
        ]);

        // --- Items Table ---
        const items = ref<BCRTableItem[]>([]);

        const fillItemDetails = (item: BCRTableItem) => {
            const selected = items.value.find((o) => o.itemCode === item.itemCode);
            if (selected) {
                item.description = selected.description ?? '';
                item.uom = selected.uom ?? '';
            }
        };
        const getItemLabel = (itemCode: string) => {
            const found = items.value.find((o) => o.itemCode === itemCode);
            return found ? found.description : itemCode;
        };

        // --- Modal ---
        const showBulkItemModal = ref(false);
        const openMeterial = () => (showBulkItemModal.value = true);
        const handleBulkItems = (selectedMaterials: any[]) => {
            selectedMaterials.forEach((mat) => {
                const isDuplicate = items.value.some((i) => i.id === mat.id);

                if (isDuplicate) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Duplicate Item',
                        detail: `Item with ID ${mat.id} already added.`,
                        life: 3000
                    });
                    return;
                }
                items.value.push({
                    id: mat.id || mat.Id || 0,
                    itemCode: mat.itemCode || mat.ItemCode || '',
                    description: mat.description || mat.Name || '',
                    uom: mat.uom || mat.Uom || '',
                    unitPrice: Number(mat.price || mat.UnitPrice || 0),
                    remark: mat.remark || mat.Remark || '',
                    location1: mat.location1 || '',
                    location2: mat.location2 || '',
                    statistics: {
                        budgetQty: Number(mat.statistics?.budgetQty || 0),
                        totalOrderedQty: Number(mat.statistics?.totalOrderedQty || 0),
                        totalRequestedQty: Number(mat.statistics?.totalRequestedQty || 0)
                    }
                });
            });

            showBulkItemModal.value = false;
        };

        // --- Calculations ---
        const calcExceedQty = (item: BCRTableItem) => (item.statistics.totalRequestedQty || 0) - (item.statistics.totalOrderedQty || 0);

        const calcExceedPercent = (item: BCRTableItem) => {
            const budget = item.statistics.budgetQty || 0;
            if (!budget) return 0;
            return (calcExceedQty(item) / budget) * 100;
        };

        const calcEstimatedExceed = (item: BCRTableItem) => calcExceedQty(item) * (item.unitPrice || 0);

        const totalVarianceAmount = computed(() => items.value.reduce((acc, it) => acc + calcEstimatedExceed(it), 0));

        const isAttachmentValid = ref(true);
        const handleExport = () => {
            const headers = ['Item Code', 'Description', 'UOM', 'Unit Price', 'Budget Qty', 'Ordered Qty', 'New Order', 'Remark'];

            const rows = items.value.map((it) => [it.itemCode, it.description, it.uom, it.unitPrice, it.statistics.budgetQty, it.statistics.totalOrderedQty, it.statistics.totalRequestedQty, it.remark || '']);

            const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bcr-items.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        const submitRequest = async () => {
            showValidation.value = true;

            // validation
            const reasonValid = !!selectedReason.value;
            const itemsValid = items.value.length > 0;

            if (!reasonValid || !itemsValid) {
                if (!reasonValid) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Validation',
                        detail: 'Please select a reason for the request',
                        life: 3000
                    });
                }
                if (!itemsValid) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Validation',
                        detail: 'Please add at least one item',
                        life: 3000
                    });
                }
                return;
            }

            const payload: BudgetChangeRequestPayload = {
                ProjectId: getCurrentProjectId(),
                RequestDate: requestDate.value,
                RequestedBy: requestBy.value,
                Department: department.value,
                Remark: remarks.value,
                TotalAmount: totalVarianceAmount.value,
                Reason: selectedReason.value || '',
                Type: 'BudgetChangeRequest',
                Items: items.value.map<BudgetChangeItemPayload>((i) => ({
                    ItemCode: i.itemCode,
                    Name: i.description,
                    Uom: i.uom,
                    UnitPrice: i.unitPrice,
                    BudgetQty: i.statistics.budgetQty,
                    OrderedQty: i.statistics.totalOrderedQty,
                    NewOrder: i.statistics.totalRequestedQty,
                    Description: i.description,
                    Remark: i.remark,
                    location: i.location1 || '',
                    element: ''
                }))
            };

            const result = await budgetCRStore.createBudgetChangeRequest(payload);
            if (result) {
                router.push({ name: 'budgetChangeRequest' });
            }
        };

        const goBack = () => router.push({ name: 'budgetChangeRequest' });

        return {
            requestBy,
            department,
            requestDate,
            selectedReason,
            remarks,
            reasonOptions,
            items,
            fillItemDetails,
            getItemLabel,
            showBulkItemModal,
            openMeterial,
            handleBulkItems,
            calcExceedQty,
            calcExceedPercent,
            calcEstimatedExceed,
            totalVarianceAmount,
            isAttachmentValid,
            handleExport,
            submitRequest,
            goBack,
            projectName,
            showValidation
        };
    }
});
