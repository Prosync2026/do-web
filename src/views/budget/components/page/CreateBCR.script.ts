// CreateBCR.script.ts
import { useBudgetStore } from '@/stores/budget/budget.store';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { AttachmentItem, BCRTableItem, BudgetChangeRequestPayload } from '@/types/budgetChangeRequest.type';
import { getCurrentProjectName } from '@/utils/contextHelper';
import SingleBudgetModal from '@/views/budget/components/dialog/CreateSingleBudgetItem.vue';
import MeterialModal from '@/views/request-orders/components/modal/CreateRo.vue';
import { Motion } from '@motionone/vue';
import { useToast } from 'primevue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'CreateBCR',
    components: { Motion, MeterialModal, SingleBudgetModal },
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

        // File upload states
        const totalSize = ref(0);
        const totalSizePercent = ref(0);
        const files = ref<File[]>([]);
        const overallRemark = ref('');
        const MAX_FILE_SIZE = 1_000_000;
        const attachments = ref<File[]>([]); // for payload
        const newAttachments = ref<File[]>([]); // for UI display
        const existingAttachments = ref<any[]>([]);
        const isAttachmentValid = ref(true);
        const fileupload = ref<any>(null);

        const formatBytes = (bytes: number) => {
            const sizes = ['B', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const createObjectURL = (file: File) => URL.createObjectURL(file);

        const onSelectedFiles = (event: { files: File[] }) => {
            // Store files for payload
            attachments.value = Array.from(event.files);

            let totalSizeTemp = 0;
            let valid = true;

            attachments.value.forEach((file: File) => {
                const size = file.size || 0;
                totalSizeTemp += size;
                if (size > MAX_FILE_SIZE) valid = false;
            });

            totalSize.value = totalSizeTemp;
            totalSizePercent.value = (totalSize.value / MAX_FILE_SIZE) * 100;

            isAttachmentValid.value = valid && totalSize.value <= MAX_FILE_SIZE;

            if (!isAttachmentValid.value) {
                toast.add({
                    severity: 'error',
                    summary: 'File too large',
                    detail: `Each file must not exceed ${formatBytes(MAX_FILE_SIZE)}.`,
                    life: 5000
                });
            }
        };

        const removeAttachment = (index: number) => {
            newAttachments.value.splice(index, 1);
            attachments.value.splice(index, 1);

            // Recalculate total size
            totalSize.value = newAttachments.value.reduce((sum, file) => sum + (file.size || 0), 0);
            totalSizePercent.value = (totalSize.value / MAX_FILE_SIZE) * 100;
        };

        const formatSize = (bytes: number) => {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const previewAttachment = (file: AttachmentItem) => {
            if (file.path) {
                window.open(file.path, '_blank');
            }
        };

        // --- Reason Options ---
        const reasonOptions = ref([
            { label: 'Exceed Budget', value: 'Exceed Budget' },
            { label: 'Mockup Remeasurement', value: 'Mockup Remeasurement' },
            { label: 'QS remeasurement', value: 'QS remeasurement' },
            { label: 'VO', value: 'VO' },
            { label: 'Others', value: 'Others' }
        ]);

        const budgetStore = useBudgetStore();

        // --- Current Budget Version ---
        const latestVersionStr = localStorage.getItem('latestBudgetVersion');
        const currentVersion = ref<number | null>(latestVersionStr !== null && !isNaN(Number(latestVersionStr)) ? Number(latestVersionStr) : null);

        // --- Budget Items from Store ---

        const budgetItems = ref<any[]>([]);

        const fetchBudgetItems = async () => {
            if (!currentVersion.value) return;

            await budgetStore.fetchBudgetItems({
                budgetId: currentVersion.value,
                page: 1,
                pageSize: 1000
            });

            budgetItems.value = budgetStore.budgetItems.map((item: any) => ({
                ...item,
                value: item.itemCode,
                label: `${item.itemCode} - ${item.description}`
            }));
        };

        onMounted(() => {
            fetchBudgetItems();
        });

        // --- BCR Items Table ---
        const items = ref<any[]>([]);

        const fillItemDetails = (row: BCRTableItem) => {
            const selected = budgetItems.value.find((b) => b.value === row.itemCode);
            if (!selected) return;

            row.budgetId = selected.budgetId;
            row.description = selected.description;
            row.uom = selected.uom;
            row.unitPrice = selected.unitPrice;
            row.remark = selected.remark;
            row.location1 = selected.location1;
            row.location2 = selected.location2;
            row.category = selected.category;
            row.element = selected.element;
            row.subElement = selected.subElement;
            row.subsubElement = selected.subsubElement;
            row.wastage = selected.wastage;

            row.statistics = {
                budgetQty: selected.budgetQty || 0,
                totalOrderedQty: selected.totalOrderedQty || 0,
                totalRequestedQty: selected.totalRequestedQty || 0
            };
        };

        const getItemLabel = (itemCode: string) => {
            const found = budgetItems.value.find((b) => b.value === itemCode);
            return found ? found.label : itemCode;
        };

        // --- Modal ---
        const showBulkItemModal = ref(false);
        const openMeterial = () => (showBulkItemModal.value = true);

        const handleBulkItems = (selectedMaterials: any[]) => {
            selectedMaterials.forEach((mat) => {
                const isDuplicate = items.value.some((i) => i.id === mat.id);
                console.log('value checking', selectedMaterials);
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
                    budgetId: mat.budgetId,
                    itemCode: mat.itemCode || mat.ItemCode || '',
                    description: mat.description || mat.Name || '',
                    uom: mat.uom || mat.Uom || '',
                    unitPrice: Number(mat.price || mat.UnitPrice || 0),
                    remark: mat.remark || mat.Remark || '',
                    location1: mat.location1 || '',
                    location2: mat.location2 || '',
                    category: mat.category,
                    element: mat.elementCode,
                    subElement: mat.subElement,
                    subsubElement: mat.subsubElement,
                    itemType: 'ExistingItem',
                    wastage: mat.wastage,
                    statistics: {
                        budgetQty: Number(mat.budgetQty || 0),
                        totalOrderedQty: Number(mat.totalOrderedQty || 0),
                        totalRequestedQty: Number(mat.totalRequestedQty || 0)
                    }
                });
            });

            showBulkItemModal.value = false;
        };

        const showSingleItemModal = ref(false);
        const openSingleBudgetItem = () => (showSingleItemModal.value = true);
        const handleAddItems = (item: any) => {
            items.value.push({
                budgetId: null,

                itemCode: item.ItemCode,
                description: item.Description,
                remark: item.Description2 || '',

                uom: item.Unit,
                unitPrice: Number(item.Amount || 0),

                location1: item.Location1 || '',
                location2: item.Location2 || '',

                category: item.Category,
                element: item.Element,
                subElement: item.SubElement,
                subsubElement: item.SubSubElement,

                itemType: 'NewItem',
                wastage: Number(item.Wastage || 0),

                statistics: {
                    budgetQty: Number(item.Quantity || 0),
                    totalOrderedQty: 0,
                    totalRequestedQty: Number(item.Quantity || 0)
                }
            });

            showSingleItemModal.value = false;
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

            const selectedProject = ref(JSON.parse(localStorage.getItem('selectedProject') || '{}'));
            const projectId = computed(() => selectedProject.value.ProjectId);

            const payload: BudgetChangeRequestPayload = {
                ProjectId: projectId.value,
                BudgetId: items.value[0]?.budgetId ?? currentVersion.value,
                RequestDate: requestDate.value,
                RequestedBy: requestBy.value,
                Department: department.value,
                Reason: selectedReason.value || '',
                Remark: remarks.value,
                TotalAmount: totalVarianceAmount.value,
                Type: 'BudgetChangeRequest',
                Items: items.value.map((i) => ({
                    BudgetItemId: i.id ?? null,
                    ItemType: i.itemType,
                    ItemCode: i.itemCode,
                    Name: i.description,
                    Uom: i.uom,
                    UnitPrice: i.unitPrice,
                    BudgetQty: i.statistics.budgetQty,
                    OrderedQty: i.statistics.totalOrderedQty,
                    NewOrder: i.statistics.totalRequestedQty || 0,
                    Description: i.description,
                    Remark: i.remark,
                    Location1: i.location1 || '',
                    Location2: i.location2 || '',
                    Element: i.element || '',
                    SubElement: i.subElement || '',
                    SubSubElement: i.subsubElement || '',
                    Category: i.category || '',
                    Wastage: i.wastage,
                    ExceededQty: calcExceedQty(i)
                }))
            };
            const attachmentsToSend = attachments.value && attachments.value.length > 0 ? attachments.value : undefined;
            const result = await budgetCRStore.createBudgetChangeRequest(payload, attachmentsToSend);

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
            showSingleItemModal,
            openSingleBudgetItem,
            openMeterial,
            handleBulkItems,
            handleAddItems,
            calcExceedQty,
            calcExceedPercent,
            calcEstimatedExceed,
            totalVarianceAmount,
            isAttachmentValid,
            handleExport,
            submitRequest,
            goBack,
            projectName,
            showValidation,
            budgetItems,
            existingAttachments,
            newAttachments,
            removeAttachment,
            previewAttachment,
            formatSize,
            files,
            overallRemark,
            totalSize,
            totalSizePercent,
            fileupload,
            onSelectedFiles,
            createObjectURL
        };
    }
});
