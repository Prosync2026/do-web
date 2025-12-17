import { requestOrderService } from '@/services/requestOrder.service';
import type { AttachmentItem, CreateRequestOrderPayload, CreateRequestOrderResponse, PreviewSummary } from '@/types/request-order.type';
import { getCurrentProjectId, getCurrentProjectName, getCurrentUsername } from '@/utils/contextHelper';
import { formatDateToAPI } from '@/utils/dateHelper';
import { Motion } from '@motionone/vue';
import AutoComplete from 'primevue/autocomplete';
import { usePrimeVue } from 'primevue/config';
import FileUpload from 'primevue/fileupload';
import Menu from 'primevue/menu';
import ProgressBar from 'primevue/progressbar';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { ComponentPublicInstance, computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BudgetItem, BudgetOption, Item, ItemOption } from '../../../../types/request-order.type';
import BudgetInfoCard from '../card/BudgetInfoCard.vue';
import CreateROModal from '../modal/CreateRo.vue';
import PreviewRo from '../modal/PreviewRo.vue';

type MenuInstance = ComponentPublicInstance & {
    toggle: (event: Event) => void;
};

export default defineComponent({
    name: 'CreateRequestOrders',
    components: { Motion, BudgetInfoCard, Menu, CreateROModal, PreviewRo, FileUpload, ProgressBar },
    setup() {
        const router = useRouter();
        const route = useRoute();
        const toast = useToast();
        const $primevue = usePrimeVue();

        const calendarValue = ref<Date | null>(null);
        const roNumber = ref('RO2510-0001');
        const budgetType = ref('Budgeted Item');
        const roDate = ref('');

        const budgetOptions = ref<BudgetOption[]>([
            { label: 'Budgeted Item', value: 'Budgeted Item' },
            { label: 'Unbudgeted Item', value: 'Unbudgeted Item' }
        ]);

        const items = ref<Item[]>([]);
        const itemOptions = ref<ItemOption[]>([
            { label: 'STL-01', value: 'STL-01', description: 'Steel reinforcement bar 60mm', location: 'Building A > Level 1-5', uom: 'Ton' },
            { label: 'CEM-02', value: 'CEM-02', description: 'Cement Portland Type I', location: 'Building B > Level 1-8', uom: 'Bag' }
        ]);

        const showBulkItemModal = ref(false);
        const showPreviewModal = ref(false);
        const menuRefs = ref<(MenuInstance | null)[]>([]);

        // File upload states
        const totalSize = ref(0);
        const totalSizePercent = ref(0);
        const files = ref<File[]>([]);
        const overallRemark = ref('');
        const MAX_FILE_SIZE = 1_000_000;
        const attachments = ref<Array<File | AttachmentItem>>([]); // unified array
        const newAttachments = ref<File[]>([]);
        const existingAttachments = ref<AttachmentItem[]>([]);
        const isAttachmentValid = ref(true);
        const showValidation = ref(false);
        const confirm = useConfirm();
        const budgetSwitching = ref(false);
        const currentProject = getCurrentProjectName();
        const globalDeliveryDate = ref<Date | null>(null);

        onMounted(async () => {
            if (route.query.mode === 'edit-draft' && route.query.draftId) {
                const draftId = route.query.draftId as string;

                try {
                    const res = await requestOrderService.getRequestOrderById(draftId);
                    console.log('Draft fetch response:', res);
                    const draft = res.data;

                    if (!draft) return;

                    roNumber.value = draft.DocNo;
                    budgetType.value = draft.PrType === 'Budgeted' || draft.BudgetType === 'Budgeted' ? 'Budgeted Item' : 'Unbudgeted Item';

                    overallRemark.value = draft.Remark || '';
                    if (draft.RequestOrderDate) calendarValue.value = new Date(draft.RequestOrderDate);

                    const draftItems = Array.isArray(draft.Items) && draft.Items.length > 0 ? draft.Items : Array.isArray(draft.request_order_items) ? draft.request_order_items : [];

                    items.value = draftItems.map((item: any) => ({
                        itemCode: item.ItemCode || '',
                        itemType: item.ItemType || 'CO',
                        budgetItemId: item.BudgetItemId ?? null,
                        nonBudgetItemId: item.NonBudgetItemId ?? null,
                        description: item.Description || '',
                        location1: item.Location1 ?? '',
                        location2: item.Location2 ?? '',
                        location: item.Location ?? '',
                        uom: item.Uom || item.Unit || '',
                        qty: Number(item.Quantity) || 0,
                        price: Number(item.Rate) || 0,
                        deliveryDate: item.DeliveryDate ? new Date(item.DeliveryDate) : null,
                        notes: item.Notes || '',
                        remark: item.Remark || item.Reason || '',
                        showNotes: false,
                        showRemark: false,
                        isBudgeted: draft.PrType === 'Budgeted' || draft.BudgetType === 'Budgeted'
                    }));

                    if (draft.Attachment) {
                        try {
                            const parsed = JSON.parse(draft.Attachment);
                            existingAttachments.value = parsed.map((att: any) => ({
                                filename: att.filename,
                                path: att.path.replace(/\\/g, '/'),
                                size: att.size,
                                type: att.type
                            }));
                            attachments.value = [...existingAttachments.value];
                        } catch (e) {
                            console.error('Failed to parse attachment JSON');
                        }
                    }

                    toast.add({
                        severity: 'info',
                        summary: 'Draft Loaded',
                        detail: `Loaded draft ${draft.DocNo}`,
                        life: 3000
                    });
                } catch (error) {
                    console.error('Failed to load draft:', error);
                    toast.add({
                        severity: 'error',
                        summary: 'Failed to Load Draft',
                        detail: 'Could not fetch draft data. Please try again.',
                        life: 5000
                    });
                }
            }
        });

        // subcon dropdown part
        const subconList = ref<{ id: number; name: string }[]>([]);
        const filteredSubconList = ref<{ id: number; name: string }[]>([]);
        const selectedSubcon = ref<{ id: number; name: string } | null>(null);
        const searchSubcon = ref('');

        const allMockSubcons = [
            { id: 1, name: 'Alpha Construction' },
            { id: 2, name: 'Beta Engineering' },
            { id: 3, name: 'Citra Builders' },
            { id: 4, name: 'Delta Subcontractor' },
            { id: 5, name: 'Evergreen Infra' },
            { id: 6, name: 'Falcon Civil Works' },
            { id: 7, name: 'Gamma Industries' },
            { id: 8, name: 'Helix Builders' },
            { id: 9, name: 'Icon Engineering' },
            { id: 10, name: 'Jade Construction' },
            { id: 11, name: 'Kinetic Engineering' },
            { id: 12, name: 'Lighthouse Infra' },
            { id: 13, name: 'Metro Builders' },
            { id: 14, name: 'Nova Contractors' },
            { id: 15, name: 'Omega Structures' },
            { id: 16, name: 'Prime Engineering' },
            { id: 17, name: 'Quantum Infra' },
            { id: 18, name: 'Radiant Builders' },
            { id: 19, name: 'Summit Contractors' },
            { id: 20, name: 'Titan Engineering' }
        ];

        const subconId = computed(() => selectedSubcon.value?.id || null);

        // Handle AutoComplete search
        const handleSubconSearch = async (event: { query: string }) => {
            const query = event.query || '';
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 300));

            if (!query.trim()) {
                filteredSubconList.value = allMockSubcons;
            } else {
                filteredSubconList.value = allMockSubcons.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
            }
        };

        // expandedRows for item table
        const expandedRows = ref<{ [key: string]: boolean }>({});

        watch(
            budgetType,
            async (newType) => {
                if (newType === 'Unbudgeted Item') {
                    // Show all subcons initially
                    filteredSubconList.value = allMockSubcons;
                    selectedSubcon.value = null;
                } else {
                    selectedSubcon.value = null;
                    filteredSubconList.value = [];
                    subconList.value = [];
                }
            },
            { immediate: true }
        );

        watch(budgetType, (newType, oldType) => {
            if (budgetSwitching.value || newType === oldType) return;

            if (items.value.length === 0 && attachments.value.length === 0 && !overallRemark.value.trim()) {
                resetFormForType(newType);
                return;
            }

            budgetSwitching.value = true; // prevent re-triggering

            confirm.require({
                message: `Switching from "${oldType}" to "${newType}" will clear all filled data to avoid conflicts. Continue?`,
                header: 'Confirm Type Change',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Yes, Reset',
                rejectLabel: 'Cancel',
                acceptClass: 'p-button-danger',
                rejectClass: 'p-button-text',
                accept: () => {
                    confirm.close();
                    resetFormForType(newType);
                    toast.add({
                        severity: 'info',
                        summary: 'Form Reset',
                        detail: `Form refreshed for ${newType}.`,
                        life: 2500
                    });
                    budgetSwitching.value = false;
                },
                reject: () => {
                    confirm.close();
                    budgetSwitching.value = true;
                    budgetType.value = oldType;
                    setTimeout(() => {
                        budgetSwitching.value = false;
                    });
                }
            });
        });

        function resetFormForType(type: string) {
            items.value = [];
            attachments.value = [];
            newAttachments.value = [];
            existingAttachments.value = [];
            overallRemark.value = '';

            if (type === 'Budgeted Item') {
                itemOptions.value = [
                    {
                        label: 'STL-01',
                        value: 'STL-01',
                        description: 'Steel reinforcement bar 60mm',
                        location: 'Building A > Level 1-5',
                        uom: 'Ton'
                    },
                    {
                        label: 'CEM-02',
                        value: 'CEM-02',
                        description: 'Cement Portland Type I',
                        location: 'Building B > Level 1-8',
                        uom: 'Bag'
                    }
                ];
            } else {
                itemOptions.value = [
                    {
                        label: 'GEN-01',
                        value: 'GEN-01',
                        description: 'General unbudgeted material',
                        location: '-',
                        uom: 'Unit'
                    },
                    {
                        label: 'OTH-02',
                        value: 'OTH-02',
                        description: 'Miscellaneous unbudgeted item',
                        location: '-',
                        uom: 'Unit'
                    }
                ];
            }
        }

        const onRemoveTemplatingFile = (file: File, removeFileCallback: (index: number) => void, index: number) => {
            removeFileCallback(index);
            totalSize.value -= file.size;
            totalSizePercent.value = Math.min((totalSize.value / 1000000) * 100, 100);
        };

        const onClearTemplatingUpload = (clear: () => void) => {
            clear();
            totalSize.value = 0;
            totalSizePercent.value = 0;
        };

        const uploadEvent = (callback: () => void) => {
            totalSizePercent.value = Math.min((totalSize.value / 1000000) * 100, 100);
            callback();
        };

        const onTemplatedUpload = () => {
            toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
        };

        const formatSize = (bytes: number) => {
            const k = 1024;
            const dm = 3;

            // Fallback sizes if $primevue or locale is undefined
            const sizes = $primevue?.config?.locale?.fileSizeTypes ?? ['Bytes', 'KB', 'MB', 'GB', 'TB'];

            if (bytes === 0) return `0 ${sizes[0]}`;

            const i = Math.floor(Math.log(bytes) / Math.log(k));
            const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

            const sizeLabel = sizes[i] ?? 'Bytes';

            return `${formattedSize} ${sizeLabel}`;
        };

        let tempIdCounter = 0;

        const addItem = () => {
            items.value.push({
                itemCode: `temp_${++tempIdCounter}`, // Temporary unique ID
                itemType: '',
                description: '',
                location: '',
                uom: '',
                qty: 1,
                price: 0,
                deliveryDate: null,
                notes: '',
                remark: '',
                showNotes: false,
                showRemark: false,
                isBudgeted: false,
                budgetItemId: 0,
                nonBudgetItemId: null
            });
        };

        const fillItemDetails = (item: Item) => {
            const selected = itemOptions.value.find((opt) => opt.value === item.itemCode);
            if (selected) {
                item.description = selected.description;
                item.uom = selected.uom;
                item.location = selected.location;
            }
        };

        const getItemLabel = (value: string): string => {
            const selected = itemOptions.value.find((opt) => opt.value === value);
            return selected ? selected.label : value;
        };

        const toggleMenu = (event: Event, index: number) => {
            const menu = menuRefs.value[index];
            if (menu) menu.toggle(event);
        };

        const getActionItems = (item: Item, index: number) => [
            {
                label: 'Delete Item',
                icon: 'pi pi-trash',
                command: () => {
                    items.value.splice(index, 1);
                    menuRefs.value.splice(index, 1);
                    delete expandedRows.value[item.itemCode]; // clean up
                }
            },
            {
                label: item.showNotes ? 'Hide Note' : 'Add Note',
                icon: 'pi pi-file',
                command: () => toggleNotes(item)
            }
        ];

        const toggleNotes = (item: Item) => {
            // Toggle the showNotes flag
            item.showNotes = !item.showNotes;

            if (item.showNotes) {
                expandedRows.value = {
                    ...expandedRows.value,
                    [item.itemCode]: true
                };
            } else {
                setTimeout(() => {
                    const newExpandedRows = { ...expandedRows.value };
                    delete newExpandedRows[item.itemCode];
                    expandedRows.value = newExpandedRows;
                }, 300);
            }
        };
        const updateNotes = (itemCode: string, value: string) => {
            const item = items.value.find((i) => i.itemCode === itemCode);
            if (item) {
                item.notes = value;
            }
        };

        const typing = ref(false);

        const handleNoteInput = () => {
            typing.value = true;
            setTimeout(() => (typing.value = false), 150);
        };

        const setMenuRef = (el: MenuInstance | null, index: number) => {
            if (el) menuRefs.value[index] = el;
        };

        const openBulkItemModal = () => {
            if (budgetType.value === 'Budgeted Item') {
                showBulkItemModal.value = true;
            }
        };

        const handleSelectedItems = (selectedBudgetItems: BudgetItem[]) => {
            const duplicates: string[] = [];
            const newUniqueItems: Item[] = [];

            selectedBudgetItems.forEach((budgetItem) => {
                const exists = items.value.some((i) => i.itemCode === budgetItem.itemCode);

                if (exists) {
                    duplicates.push(budgetItem.itemCode);
                } else {
                    newUniqueItems.push({
                        itemCode: budgetItem.itemCode,
                        itemType: budgetItem.itemType,
                        description: budgetItem.description,
                        location: budgetItem.location,
                        uom: budgetItem.uom,
                        budgetItemId: budgetItem.id,
                        qty: budgetItem.qty,
                        deliveryDate: globalDeliveryDate.value,
                        notes: '',
                        remark: '',
                        price: budgetItem.price,
                        showNotes: false,
                        showRemark: false,
                        isBudgeted: true
                    });
                    // Add to itemOptions if not exist
                    const existingOption = itemOptions.value.find((opt) => opt.value === budgetItem.itemCode);
                    if (!existingOption) {
                        itemOptions.value.push({
                            label: budgetItem.itemCode,
                            value: budgetItem.itemCode,
                            description: budgetItem.description,
                            location: budgetItem.location,
                            uom: budgetItem.uom
                        });
                    }
                }
            });

            // Add only unique items
            if (newUniqueItems.length > 0) {
                items.value.push(...newUniqueItems);
                console.log('Items after adding from budget:', items.value);
                toast.add({
                    severity: 'success',
                    summary: 'Items Added',
                    detail: `${newUniqueItems.length} item(s) added from budget`,
                    life: 2500
                });
            }

            // Show duplicate message
            if (duplicates.length > 0) {
                toast.add({
                    severity: 'warn',
                    summary: 'Duplicate Items',
                    detail: `These items were already added: ${duplicates.join(', ')}. Only new items were added.`,
                    life: 9000
                });
            }
        };

        function removeAttachment(index: number) {
            const removed = attachments.value.splice(index, 1)[0];

            // If it's an existing attachment, also remove from existingAttachments
            if ('path' in removed) {
                existingAttachments.value = existingAttachments.value.filter((att) => att.path !== removed.path);
            } else {
                newAttachments.value = newAttachments.value.filter((f) => f !== removed);
            }

            console.log('Attachments after removal:', attachments.value);
        }

        // Preview/download existing attachment
        function previewAttachment(file: AttachmentItem) {
            // URL in a new tab
            const url = requestOrderService.getAttachmentUrl(file);
            window.open(url, '_blank');
        }

        function downloadAttachment(file: AttachmentItem) {
            requestOrderService.downloadAttachment(file);
        }

        const onSelectedFiles = (event: { files: File[] }) => {
            attachments.value = event.files;
            let totalSizeTemp = 0;
            let valid = true;

            attachments.value.forEach((file) => {
                const size = file.size || 0; // default to 0 if undefined
                totalSizeTemp += size;
                if (size > MAX_FILE_SIZE) valid = false;
            });

            totalSize.value = totalSizeTemp;
            totalSizePercent.value = (totalSize.value / MAX_FILE_SIZE) * 100;

            if (!valid || totalSize.value > MAX_FILE_SIZE) {
                toast.add({
                    severity: 'error',
                    summary: 'File too large',
                    detail: `Each file must not exceed ${formatBytes(MAX_FILE_SIZE)}.`,
                    life: 5000
                });
                isAttachmentValid.value = false;
            } else {
                isAttachmentValid.value = true;
            }
        };

        const formatBytes = (bytes: number) => {
            const sizes = ['B', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const grandTotal = computed(() => {
            return items.value.reduce((sum, item) => {
                const price = item.price ?? 0;
                const qty = item.qty ?? 0;
                return sum + price * qty;
            }, 0);
        });

        const canSubmit = computed(() => {
            const hasItems = items.value.length > 0;
            const hasRoNumber = roNumber.value.trim() !== '';
            const hasRoDate = calendarValue.value !== null;
            const hasBudgetType = budgetType.value !== '';

            return hasItems && hasRoNumber && hasRoDate && hasBudgetType;
        });

        const previewSummary = computed<PreviewSummary>(() => {
            const data: PreviewSummary = {
                totalItems: items.value.length,
                totalAmount: grandTotal.value,
                globalDeliveryDate: globalDeliveryDate.value ? globalDeliveryDate.value.toLocaleDateString('en-GB') : '',
                budgetType: budgetType.value,
                project: getCurrentProjectName() || '',
                roDate: calendarValue.value ? calendarValue.value.toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                roNumber: roNumber.value,
                requestedBy: getCurrentUsername() || 'Unknown User',
                items: items.value.map((item) => ({
                    itemCode: item.itemCode,
                    itemType: item.itemType || '',
                    description: item.description,
                    uom: item.uom,
                    qty: item.qty,
                    price: item.price ?? 0,
                    // convert string to Date
                    deliveryDate: item.deliveryDate ? (item.deliveryDate instanceof Date ? item.deliveryDate : new Date(item.deliveryDate)) : null,
                    location: item.location,
                    notes: item.notes,
                    remark: item.remark
                })),
                overallRemark: overallRemark.value,
                attachmentsCount: attachments.value.length
            };
            return data;
        });

        function openPreviewModal() {
            if (!canSubmit.value) {
                showValidation.value = true;

                if (!roNumber.value.trim()) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Validation Error',
                        detail: 'RO Number is required.',
                        life: 4000
                    });
                }

                if (!budgetType.value) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Validation Error',
                        detail: 'Budget Type is required.',
                        life: 4000
                    });
                }

                if (!calendarValue.value) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Validation Error',
                        detail: 'RO Date is required.',
                        life: 4000
                    });
                }

                if (!globalDeliveryDate.value) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Validation Error',
                        detail: 'Delivery Date is required.',
                        life: 4000
                    });
                }

                if (items.value.length === 0) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Validation Error',
                        detail: 'At least one item is required.',
                        life: 4000
                    });
                }

                return;
            }

            showValidation.value = false;
            showPreviewModal.value = true;
        }

        const submitRequestOrder = async () => {
            try {
                const projectId = getCurrentProjectId();
                const payload: CreateRequestOrderPayload = {
                    ProjectId: projectId,
                    DocNo: roNumber.value,
                    TotalAmount: grandTotal.value,
                    DebtorId: 1,
                    RequestOrderDate: formatDateToAPI(calendarValue.value) ?? '',
                    Terms: 'Net 30',
                    RefDoc: '',
                    BudgetType: budgetType.value === 'Budgeted Item' ? 'Budgeted' : 'NonBudgeted',
                    Type: 'requestOrder',
                    Remark: overallRemark.value || '',
                    CreatedBy: getCurrentUsername() || 'Unknown User',
                    Status: 'Processing',
                    Currency: 'MYR',
                    Items: items.value.map((item) => ({
                        BudgetItemId: item.budgetItemId ?? null,
                        NonBudgetItemId: item.nonBudgetItemId ?? null,
                        Description: item.description,
                        Uom: item.uom,
                        ItemCode: item.itemCode,
                        ItemType: item.itemType,
                        Quantity: item.qty,
                        // later adjust when the api is ready for the OrgBgtQty, BgtBalQty, TotalPOQty
                        OrgBgtQty: 0,
                        BgtBalQty: 0,
                        TotalPOQty: 0,
                        //
                        Rate: item.price ?? 0,
                        Notes: item.notes ?? '',
                        Reason: '',
                        DeliveryDate: formatDateToAPI(globalDeliveryDate.value)
                    }))
                };
                const isDraft = !!route.query.draftId; // check if editing a draft
                const attachmentsToSend = attachments.value.length > 0 ? attachments.value : undefined;

                let result: CreateRequestOrderResponse;

                if (isDraft) {
                    result = await requestOrderService.submitDraftRequestOrder(route.query.draftId as string, payload, attachments.value.length > 0 ? attachments.value : undefined);
                } else {
                    result = await requestOrderService.createRequestOrder(payload, attachmentsToSend);
                }

                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Request Order Submitted',
                        detail: `New RO has been created successfully`,
                        life: 3000
                    });

                    setTimeout(() => {
                        router.push('/request-orders');
                    }, 1000);
                } else {
                    toast.add({
                        severity: 'error',
                        summary: 'Submission Failed',
                        detail: result.message || 'Failed to submit request order',
                        life: 5000
                    });
                }
            } catch (error: unknown) {
                console.error('Submit failed:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);

                toast.add({
                    severity: 'error',
                    summary: 'Submission Error',
                    detail: errorMessage,
                    life: 5000
                });
            }
        };

        async function saveDraft() {
            if (!canSubmit.value) {
                showValidation.value = true;

                let errorMessage = 'Please ensure all required fields are filled before saving as draft:';
                if (items.value.length === 0) {
                    errorMessage += ' At least one item is required.';
                }
                if (!roNumber.value.trim()) {
                    errorMessage += ' RO Number is required.';
                }
                if (!budgetType.value) {
                    errorMessage += ' Budget Type is required.';
                }
                if (!calendarValue.value) {
                    errorMessage += ' RO Date is required.';
                }

                toast.add({
                    severity: 'warn',
                    summary: 'Validation Error',
                    detail: errorMessage,
                    life: 4000
                });
                return;
            }

            showValidation.value = false;

            try {
                const projectId = getCurrentProjectId();

                const payload: CreateRequestOrderPayload = {
                    ProjectId: projectId,
                    DocNo: roNumber.value,
                    DebtorId: 1,
                    RequestOrderDate: calendarValue.value instanceof Date ? formatDateToAPI(calendarValue.value) : formatDateToAPI(new Date()),
                    Terms: 'Net 30',
                    RefDoc: '',
                    BudgetType: budgetType.value === 'Budgeted Item' ? 'Budgeted' : 'NonBudgeted',
                    Type: 'requestOrder',
                    Remark: overallRemark.value || '',
                    CreatedBy: getCurrentUsername() || 'Unknown User',
                    Status: 'Processing',
                    Currency: 'MYR',
                    TotalAmount: grandTotal.value,
                    Items: items.value.map((item) => ({
                        BudgetItemId: item.budgetItemId ?? null,
                        NonBudgetItemId: item.nonBudgetItemId ?? null,
                        Description: item.description,
                        Uom: item.uom,
                        ItemCode: item.itemCode,
                        ItemType: item.itemType || 'CO',
                        Quantity: item.qty, // corrected
                        OrgBgtQty: 0,
                        BgtBalQty: 0,
                        TotalPOQty: 0,
                        Rate: item.price ?? 0,
                        Notes: item.notes ?? '',
                        Reason: '',
                        DeliveryDate: formatDateToAPI(globalDeliveryDate.value)
                    }))
                };

                const result = await requestOrderService.createRequestOrderDraft(payload, attachments.value.length > 0 ? attachments.value : undefined);

                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Draft Saved',
                        detail: `RO ${roNumber.value} has been saved as draft successfully`,
                        life: 3000
                    });
                    setTimeout(() => {
                        router.push('/request-orders');
                    }, 1000);
                } else {
                    toast.add({
                        severity: 'error',
                        summary: 'Save Draft Failed',
                        detail: result.message || 'Failed to save request order as draft',
                        life: 5000
                    });
                }
            } catch (error: unknown) {
                console.error('Save draft failed:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);

                toast.add({
                    severity: 'error',
                    summary: 'Save Draft Error',
                    detail: errorMessage,
                    life: 5000
                });
            }
        }
        function applyDeliveryDateToAll(value: Date | Date[] | (Date | null)[] | null | undefined) {
            const date = value instanceof Date ? value : null;

            items.value.forEach((item) => {
                item.deliveryDate = date;
            });
        }

        return {
            roNumber,
            budgetType,
            roDate,
            budgetOptions,
            calendarValue,
            items,
            addItem,
            itemOptions,
            fillItemDetails,
            getItemLabel,
            toggleMenu,
            getActionItems,
            menuRefs,
            setMenuRef,
            grandTotal,
            canSubmit,
            showBulkItemModal,
            showPreviewModal,
            openBulkItemModal,
            handleSelectedItems,
            openPreviewModal,
            submitRequestOrder,
            saveDraft,
            previewSummary,
            files,
            totalSize,
            totalSizePercent,
            onSelectedFiles,
            uploadEvent,
            onTemplatedUpload,
            formatSize,
            onRemoveTemplatingFile,
            onClearTemplatingUpload,
            isAttachmentValid,
            attachments,
            overallRemark,
            removeAttachment,
            newAttachments,
            existingAttachments,
            MAX_FILE_SIZE,
            previewAttachment,
            showValidation,
            AutoComplete,
            searchSubcon,
            selectedSubcon,
            filteredSubconList,
            subconId,
            handleSubconSearch,
            downloadAttachment,
            expandedRows,
            updateNotes,
            handleNoteInput,
            currentProject,
            formatDateToAPI,
            applyDeliveryDateToAll,
            globalDeliveryDate
        };
    }
});
