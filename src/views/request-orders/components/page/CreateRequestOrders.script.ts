import { budgetService } from '@/services/budget.service';
import { requestOrderService } from '@/services/requestOrder.service';
import { subconService, type Subcon } from '@/services/subcon.service';
import type { BudgetStatisticsResponse } from '@/types/budget.type';
import type { AttachmentItem, CreateRequestOrderPayload, CreateRequestOrderResponse, PreviewSummary } from '@/types/request-order.type';
import { getCurrentProjectId, getCurrentProjectName, getCurrentUsername } from '@/utils/contextHelper';
import { formatDateToAPI } from '@/utils/dateHelper';
import { Motion } from '@motionone/vue';
import AutoComplete from 'primevue/autocomplete';
import { usePrimeVue } from 'primevue/config';
import Menu from 'primevue/menu';
import ProgressBar from 'primevue/progressbar';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import type { StockItem } from 'src/types/stockItem.type.ts';
import { ComponentPublicInstance, computed, defineComponent, markRaw, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BudgetOption, Item, ItemOption } from '../../../../types/request-order.type';
import BudgetInfoCard from '../card/BudgetInfoCard.vue';
import CreateROModal from '../modal/CreateRo.vue';
import CreateStockItem from '../modal/CreateStockItem.vue';
import PreviewRo from '../modal/PreviewRo.vue';
import { ProButton, ProCard, ProInput, ProPageHeader, ProSelect, ProTable, ProTabs, ProTag, ProTextarea, ProModal, ProDatePicker, ProUploadFile, type UploadFile, type DateRange, type TableColumn } from '@prosync_solutions/ui';
import { PhPackage, PhPlus, PhDotsThreeVertical, PhXCircle, PhWarning, PhTrash, PhFileText } from '@phosphor-icons/vue';

type MenuInstance = ComponentPublicInstance & {
    toggle: (event: Event) => void;
};

export default defineComponent({
    name: 'CreateRequestOrders',
    components: { Motion, BudgetInfoCard, Menu, CreateROModal, CreateStockItem, PreviewRo, ProgressBar, ProButton, ProCard, ProInput, ProPageHeader, ProSelect, ProTable, ProTabs, ProTag, ProTextarea, ProModal, AutoComplete, ProDatePicker, ProUploadFile, PhPackage, PhPlus, PhDotsThreeVertical, PhXCircle, PhWarning, PhTrash, PhFileText },
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
        const showStockItemModal = ref(false);
        const showPreviewModal = ref(false);
        const menuRefs = ref<(MenuInstance | null)[]>([]);

        // File upload states
        const totalSize = ref(0);
        const totalSizePercent = ref(0);
        const files = ref<File[]>([]);
        const overallRemark = ref('');
        const MAX_FILE_SIZE = 1_000_000;

        const tableColumns = computed<TableColumn[]>(() => {
            return [
                { key: 'itemCode', label: 'Item Code', width: '20%' },
                { key: 'description', label: 'Description', width: '25%' },
                { key: 'location', label: 'Location', width: '18%' },
                { key: 'uom', label: 'UOM', width: '70px', align: 'center' },
                { key: 'qty', label: 'Quantity', width: '130px' },
                { key: 'deliveryDate', label: 'Delivery Date', width: '160px' },
                { key: 'price', label: 'Price', width: '140px' }, // Keep logic but can hide with classes
                { key: 'total', label: 'Total', width: '130px', align: 'right' },
                { key: 'action', label: 'Action', width: '60px', align: 'center' }
            ];
        });
        const uploadFilesList = ref<UploadFile[]>([]); // Unified storage for ProUploadFile
        const isAttachmentValid = ref(true);

        const showValidation = ref(false);
        const confirm = useConfirm();
        const budgetSwitching = ref(false);
        const currentProject = getCurrentProjectName();
        const projectId = getCurrentProjectId();
        const globalDeliveryDate = ref<Date | null>(null);

        // draft
        const draftId = ref<string | null>(route.query.draftId ? String(route.query.draftId) : null);
        const mode = ref<string | null>(route.query.mode ? String(route.query.mode) : null);

        onMounted(async () => {
            calendarValue.value = new Date(); // default to today
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
                            const draftAttachments: AttachmentItem[] = JSON.parse(draft.Attachment);
                            uploadFilesList.value = draftAttachments.map(att => ({
                                id: att.path || att.filename,
                                file: new File([], att.filename),
                                name: att.filename,
                                size: att.size || 0,
                                type: att.type || 'application/octet-stream',
                                status: 'done',
                                url: requestOrderService.getAttachmentUrl({
                                    filename: att.filename,
                                    path: att.path.replace(/\\/g, '/'),
                                    size: att.size,
                                    type: att.type
                                })
                            }));
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
        const subconList = ref<Subcon[]>([]);
        const filteredSubconList = ref<Subcon[]>([]);
        const selectedSubcon = ref<Subcon | null>(null);
        const searchSubcon = ref('');

        // Fetch all subcon from API
        const fetchSubcons = async () => {
            subconList.value = await subconService.getAll();
            filteredSubconList.value = [...subconList.value];
        };

        // Handle AutoComplete search
        const handleSubconSearch = async (event: { query: string }) => {
            const query = event.query || '';
            await new Promise((resolve) => setTimeout(resolve, 200)); // optional delay
            if (!query.trim()) {
                filteredSubconList.value = [...subconList.value];
            } else {
                filteredSubconList.value = subconList.value.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
            }
        };

        // Watch budgetType to reset subcon selection
        watch(
            budgetType,
            async (newType) => {
                if (newType === 'Unbudgeted Item') {
                    await fetchSubcons();
                    selectedSubcon.value = null;
                } else {
                    selectedSubcon.value = null;
                    filteredSubconList.value = [];
                    subconList.value = [];
                }
            },
            { immediate: true }
        );

        // Reason dropdown
        const reasonOptions = [
            { label: 'Damage', value: 'Damage' },
            { label: 'Defect', value: 'Defect' },
            { label: 'Missing', value: 'Missing' },
            { label: 'Prelim', value: 'Prelim' },
            { label: 'Renovation', value: 'Renovation' },
            { label: 'Show house', value: 'Show house' },
            { label: 'VO', value: 'VO' }
        ];

        const selectedReason = ref<string | null>(null);

        // reset reason dropdown
        watch(budgetType, (newType) => {
            if (newType !== 'Unbudgeted Item') {
                selectedReason.value = null;
            }
        });

        const invalidDeliveryByCode = ref<Record<string, boolean>>({});

        watch(budgetType, (newType, oldType) => {
            if (budgetSwitching.value || newType === oldType) return;

            if (items.value.length === 0 && uploadFilesList.value.length === 0 && !overallRemark.value.trim()) {
                resetFormForType(newType);
                return;
            }

            budgetSwitching.value = true; // prevent re-triggering

            confirm.require({
                message: `Switching from "${oldType}" to "${newType}" will clear all filled data to avoid conflicts. Continue?`,
                header: 'Confirm Type Change',
                icon: markRaw(PhWarning) as any,
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
            uploadFilesList.value = [];
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

        const getActionItems = (item: Item, index: number): any[] => [
            {
                label: 'Delete Item',
                icon: PhTrash,
                command: () => {
                    items.value.splice(index, 1);
                    menuRefs.value.splice(index, 1);
                }
            },
            {
                label: item.showNotes ? 'View Note' : 'Add Note',
                icon: PhFileText,
                command: () => openNoteModal(item)
            }
        ];

        // Item note modal tracking
        const noteModalItem = ref<Item | null>(null);
        const openNoteModal = (item: Item) => {
            noteModalItem.value = item;
            item.showNotes = true;
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

        function onDeliveryDateChange(item: Item) {
            if (item.itemCode && invalidDeliveryByCode.value[item.itemCode]) {
                if (item.deliveryDate) {
                    const updated = { ...invalidDeliveryByCode.value };
                    delete updated[item.itemCode];
                    invalidDeliveryByCode.value = updated;
                }
            }
        }

        const handleDeliveryInput = (event: Event, item: Item) => {
            const target = event.target as HTMLInputElement;
            item.deliveryDate = target.value ? new Date(target.value) : null;
            onDeliveryDateChange(item);
        };

        const handleDeliveryPicker = (val: string | Date | null, item: Item) => {
            item.deliveryDate = typeof val === 'string' && val ? new Date(val) : (val instanceof Date ? val : null);
            onDeliveryDateChange(item);
        };

        const setMenuRef = (el: MenuInstance | null, index: number) => {
            if (el) menuRefs.value[index] = el;
        };

        const openBulkItemModal = () => {
            if (budgetType.value === 'Budgeted Item') {
                showBulkItemModal.value = true;
            }
        };

        const openStockItemModal = () => {
            showStockItemModal.value = true;
        };

        const showCreateROModal = ref(false);

        const handleSelectedItems = (selectedBudgetItems: any[]) => {
            const duplicates: string[] = [];

            // Defer processing to next tick to avoid recursive updates from immediate state changes
            setTimeout(() => {
                const groupedMap = new Map<string, Item>();

                selectedBudgetItems.forEach((budgetItem) => {
                    const desc2 = budgetItem.description2 || '';
                    const groupKey = `${budgetItem.itemCode}|${budgetItem.description}|${desc2}`;

                    // To prevent dupes across already selected items in the UI, we check if budgetItemId already exists anywhere.
                    const budgetId = budgetItem.id || budgetItem.budgetItemId;
                    const exists = items.value.some((i) => {
                        if (i.budgetItemId === budgetId) return true;
                        if (i.originalBudgetItems?.some((orig) => (orig.id || orig.budgetItemId) === budgetId)) return true;
                        return false;
                    });

                    if (exists) {
                        duplicates.push(budgetItem.itemCode);
                    } else if (groupedMap.has(groupKey)) {
                        const existing = groupedMap.get(groupKey)!;
                        existing.qty += Number(budgetItem.qty || 0);

                        const loc1Set = new Set(
                            existing.location1
                                ? existing.location1
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                : []
                        );
                        if (budgetItem.location1) loc1Set.add(budgetItem.location1.trim());
                        existing.location1 = Array.from(loc1Set).join(', ');

                        const loc2Set = new Set(
                            existing.location2
                                ? existing.location2
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                : []
                        );
                        if (budgetItem.location2) loc2Set.add(budgetItem.location2.trim());
                        existing.location2 = Array.from(loc2Set).join(', ');

                        existing.location = [existing.location1, existing.location2].filter(Boolean).join(' > ');
                        existing.originalBudgetItems!.push({ ...budgetItem });
                    } else {
                        groupedMap.set(groupKey, {
                            itemCode: budgetItem.itemCode,
                            itemType: budgetItem.itemType,
                            description: budgetItem.description,
                            description2: desc2,
                            location: budgetItem.location || [budgetItem.location1, budgetItem.location2].filter(Boolean).join(' > '),
                            location1: budgetItem.location1 || '',
                            location2: budgetItem.location2 || '',
                            uom: budgetItem.uom,
                            budgetItemId: budgetId,
                            qty: Number(budgetItem.qty || 0),
                            deliveryDate: budgetItem.deliveryDate ? new Date(budgetItem.deliveryDate) : null,
                            notes: '',
                            remark: '',
                            price: budgetItem.price,
                            showNotes: false,
                            showRemark: false,
                            isBudgeted: true,
                            originalBudgetItems: [{ ...budgetItem }]
                        });

                        const existingOption = itemOptions.value.find((opt) => opt.value === budgetItem.itemCode && opt.description === budgetItem.description && opt.description2 === desc2);
                        if (!existingOption) {
                            itemOptions.value.push({
                                label: budgetItem.itemCode,
                                value: budgetItem.itemCode,
                                description: budgetItem.description,
                                description2: desc2,
                                location: budgetItem.location || [budgetItem.location1, budgetItem.location2].filter(Boolean).join(' > '),
                                uom: budgetItem.uom
                            });
                        }
                    }
                });

                const finalGrouped = Array.from(groupedMap.values());

                if (finalGrouped.length > 0) {
                    items.value.push(...finalGrouped);
                    toast.add({
                        severity: 'success',
                        summary: 'Items Added',
                        detail: `${finalGrouped.length} item(s) grouped and added from budget`,
                        life: 2500
                    });
                }

                if (duplicates.length > 0) {
                    const uniqueDups = Array.from(new Set(duplicates));
                    toast.add({
                        severity: 'warn',
                        summary: 'Duplicate Items',
                        detail: `These items were already added: ${uniqueDups.join(', ')}`,
                        life: 9000
                    });
                }

                showCreateROModal.value = false;
            }, 0);
        };

        const handleStockItemsSelected = (selectedStockItems: Array<StockItem & { deliveryDate?: string | Date | null }>) => {
            const duplicates: string[] = [];

            setTimeout(() => {
                const groupedMap = new Map<string, Item>();

                selectedStockItems.forEach((stockItem) => {
                    const desc2 = ''; 
                    const groupKey = `${stockItem.itemCode}|${stockItem.name}|${desc2}`;

                    const stockId = stockItem.id;
                    const exists = items.value.some((i) => {
                        if (i.nonBudgetItemId === stockId) return true;
                        if (i.originalBudgetItems?.some((orig) => (orig.id || orig.nonBudgetItemId) === stockId)) return true;
                        return false;
                    });

                    if (exists) {
                        duplicates.push(stockItem.itemCode);
                    } else if (groupedMap.has(groupKey)) {
                        const existing = groupedMap.get(groupKey)!;
                        existing.qty += 1;

                        const loc1Set = new Set(existing.location1 ? existing.location1.split(',').map((s) => s.trim()).filter(Boolean) : []);
                        if (stockItem.element) loc1Set.add(stockItem.element.trim());
                        existing.location1 = Array.from(loc1Set).join(', ');

                        const loc2Set = new Set(existing.location2 ? existing.location2.split(',').map((s) => s.trim()).filter(Boolean) : []);
                        if (stockItem.subElement) loc2Set.add(stockItem.subElement.trim());
                        existing.location2 = Array.from(loc2Set).join(', ');

                        existing.location = [existing.location1, existing.location2].filter(Boolean).join(' > ');
                        existing.originalBudgetItems!.push({ ...stockItem, qty: 1, nonBudgetItemId: stockId });
                    } else {
                        let deliveryDate: Date | null = null;
                        if (stockItem.deliveryDate) {
                            if (stockItem.deliveryDate instanceof Date) {
                                deliveryDate = stockItem.deliveryDate;
                            } else {
                                const d = new Date(stockItem.deliveryDate);
                                deliveryDate = isNaN(d.getTime()) ? null : d;
                            }
                        }

                        groupedMap.set(groupKey, {
                            itemCode: stockItem.itemCode,
                            itemType: stockItem.itemType,
                            description: stockItem.name,
                            description2: '',
                            location: `${stockItem.element || ''} > ${stockItem.subElement || ''}`.replace(/^ > | > $/g, '') || '',
                            location1: stockItem.element || '',
                            location2: stockItem.subElement || '',
                            uom: stockItem.uom,
                            budgetItemId: null,
                            nonBudgetItemId: stockId,
                            qty: 1,
                            deliveryDate,
                            notes: '',
                            remark: '',
                            price: 0,
                            showNotes: false,
                            showRemark: false,
                            isBudgeted: false,
                            originalBudgetItems: [{ ...stockItem, qty: 1, nonBudgetItemId: stockId }]
                        });

                        const existingOption = itemOptions.value.find((opt) => opt.value === stockItem.itemCode && opt.description === stockItem.name);
                        if (!existingOption) {
                            itemOptions.value.push({
                                label: stockItem.itemCode,
                                value: stockItem.itemCode,
                                description: stockItem.name,
                                description2: '',
                                location: `${stockItem.element || ''} > ${stockItem.subElement || ''}`.replace(/^ > | > $/g, '') || '',
                                uom: stockItem.uom
                            });
                        }
                    }
                });

                const finalGrouped = Array.from(groupedMap.values());

                if (finalGrouped.length > 0) {
                    items.value.push(...finalGrouped);

                    toast.add({
                        severity: 'success',
                        summary: 'Items Added',
                        detail: `${finalGrouped.length} item(s) grouped and added from stock`,
                        life: 2500
                    });
                }

                if (duplicates.length > 0) {
                    const uniqueDups = Array.from(new Set(duplicates));
                    toast.add({
                        severity: 'warn',
                        summary: 'Duplicate Items',
                        detail: `These items were already added: ${uniqueDups.join(', ')}`,
                        life: 9000
                    });
                }
            }, 0);
        };

        const grandTotal = computed(() => {
            return items.value.reduce((sum, item) => {
                const price = item.price ?? 0;
                const qty = item.qty ?? 0;
                return sum + price * qty;
            }, 0);
        });

        const itemStats = ref<Record<number, BudgetStatisticsResponse>>({});

        watch(
            () => items.value,
            async (newItems) => {
                const budgetItems = (newItems as typeof items.value).filter((i) => {
                    return i.budgetItemId != null;
                });

                const budgetItemIds = budgetItems.map((i) => i.budgetItemId).filter((id): id is number => id != null);

                if (budgetItemIds.length > 0) {
                    await fetchItemStatistics(budgetItemIds);
                } else {
                    itemStats.value = {};
                }
            },
            { immediate: true, deep: true }
        );

        async function fetchItemStatistics(budgetItemIds: number[]) {
            const stats: Record<number, BudgetStatisticsResponse> = {};

            await Promise.all(
                budgetItemIds.map(async (id) => {
                    try {
                        const response = await budgetService.budgetItemStatistics(id);
                        if (response.success) {
                            stats[id] = response.data;
                        } else {
                            console.warn(`Stats fetch returned success=false for item ${id}`);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch stats for item ${id}:`, error);
                    }
                })
            );

            itemStats.value = stats;
        }

        const previewSummary = computed<PreviewSummary>(() => {
            const data: PreviewSummary = {
                totalItems: items.value.length,
                totalAmount: grandTotal.value,
                globalDeliveryDate: globalDeliveryDate.value ? globalDeliveryDate.value.toLocaleDateString('en-GB') : '',
                budgetType: budgetType.value,
                project: getCurrentProjectName() || '',
                roDate: calendarValue.value ? calendarValue.value.toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                roNumber: roNumber.value,
                reason: selectedReason.value || '',
                requestedBy: getCurrentUsername() || 'Unknown User',
                subcon: selectedSubcon.value ? selectedSubcon.value.name : 'N/A',
                items: items.value.map((item) => {
                    const budgetItemId = item.budgetItemId;
                    const stats = budgetItemId != null ? itemStats.value[budgetItemId] : undefined;

                    return {
                        itemCode: item.itemCode,
                        itemType: item.itemType || '',
                        description: item.description,
                        uom: item.uom,
                        qty: Number(item.qty.toFixed(2)),
                        price: item.price ?? 0,
                        deliveryDate: item.deliveryDate ? (item.deliveryDate instanceof Date ? item.deliveryDate : new Date(item.deliveryDate)) : null,
                        location: item.location,
                        location1: item.location1,
                        location2: item.location2,
                        notes: item.notes,
                        remark: item.remark,
                        qtyRequested: stats?.totalRequestedQty ?? 0,
                        qtyOrdered: stats?.totalOrderedQty ?? 0,
                        qtyDelivered: stats?.totalDeliveredQty ?? 0,
                        balance: stats?.totalBalance ?? 0,
                        budgetQty: stats?.budgetQty ?? 0
                    };
                }),
                overallRemark: overallRemark.value,
                attachmentsCount: uploadFilesList.value.length
            };

            return data;
        });

        const canSubmit = computed(() => {
            const hasItems = items.value.length > 0;
            const hasRoNumber = roNumber.value.trim() !== '';
            const hasRoDate = calendarValue.value !== null;
            const hasBudgetType = budgetType.value !== '';
            return hasItems && hasRoNumber && hasRoDate && hasBudgetType;
        });

        function openPreviewModal() {
            // For unbudgeted items, ensure each row has a delivery date
            if (budgetType.value === 'Unbudgeted Item') {
                const missing = items.value.filter((it) => !it.deliveryDate);
                invalidDeliveryByCode.value = missing.reduce<Record<string, boolean>>((acc, it) => {
                    acc[it.itemCode] = true;
                    return acc;
                }, {});
            }

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

        const getUngroupedItems = () => {
            const ungrouped: Item[] = [];
            items.value.forEach((item) => {
                if (item.originalBudgetItems && item.originalBudgetItems.length > 0) {
                    let remainingQty = item.qty;
                    item.originalBudgetItems.forEach((orig, index) => {
                        const isLast = index === item.originalBudgetItems!.length - 1;
                        let qtyToAssign = 0;
                        if (isLast) {
                            qtyToAssign = remainingQty;
                        } else {
                            qtyToAssign = Math.min(Number(orig.qty || 0), remainingQty);
                        }
                        remainingQty -= qtyToAssign;

                        if (qtyToAssign > 0 || item.originalBudgetItems!.length === 1) {
                            const newLoc1 = orig.location1 || orig.element || '';
                            const newLoc2 = orig.location2 || orig.subElement || '';
                            ungrouped.push({
                                ...item,
                                budgetItemId: item.isBudgeted ? (orig.id || orig.budgetItemId) : null,
                                nonBudgetItemId: !item.isBudgeted ? (orig.id || orig.nonBudgetItemId) : null,
                                qty: qtyToAssign > 0 ? qtyToAssign : 0,
                                location1: newLoc1,
                                location2: newLoc2,
                                location: orig.location || [newLoc1, newLoc2].filter(Boolean).join(' > '),
                                originalBudgetItems: undefined // Wipe this cleanly
                            });
                        }
                    });
                } else {
                    ungrouped.push(item);
                }
            });
            return ungrouped;
        };

        const submitRequestOrder = async () => {
            if (!canSubmit.value) return;

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
                    Reason: selectedReason.value || '',
                    Items: getUngroupedItems().map((item) => {
                        const budgetItemId = item.budgetItemId;
                        const stats = budgetItemId != null ? itemStats.value[budgetItemId] : undefined;

                        // Prefer row delivery date; otherwise fall back to global delivery date if set
                        let itemDeliveryDate = item.deliveryDate;
                        if (!itemDeliveryDate && globalDeliveryDate.value) {
                            itemDeliveryDate = globalDeliveryDate.value;
                        }

                        return {
                            BudgetItemId: item.budgetItemId ?? null,
                            NonBudgetItemId: item.nonBudgetItemId ?? null,
                            StockItemId: item.nonBudgetItemId ?? null,
                            Description: item.description,
                            Uom: item.uom,
                            ItemCode: item.itemCode,
                            ItemType: item.itemType,
                            Quantity: Number(item.qty.toFixed(2)),

                            Location1: item.location1,
                            Location2: item.location2,
                            OrgBgtQty: stats?.totalOrderedQty ?? 0,
                            BgtBalQty: stats?.totalBalance ?? 0,
                            TotalGrnQty: stats?.totalDeliveredQty ?? 0,
                            TotalPOQty: 0,
                            Rate: item.price ?? 0,
                            Notes: item.notes ?? '',
                            Reason: selectedReason.value || '',
                            DeliveryDate: itemDeliveryDate ? formatDateToAPI(itemDeliveryDate) : null,
                            SubconId: selectedSubcon.value && selectedSubcon.value.id ? Number(selectedSubcon.value.id) : null
                        };
                    })
                };

                // add existing attachments
                const carryOvers = uploadFilesList.value.filter((uf: UploadFile) => uf.status === 'done').map((uf: UploadFile) => ({
                    filename: uf.name,
                    path: uf.id, // we mapped path to id earlier
                    size: uf.size,
                    type: uf.type
                }));
                
                if (carryOvers.length > 0) {
                    payload.Attachment = JSON.stringify(carryOvers);
                }

                const isDraft = !!route.query.draftId;
                const filesToSend = uploadFilesList.value.filter((uf: UploadFile) => uf.status !== 'done').map((uf: UploadFile) => uf.file);

                let result: CreateRequestOrderResponse;

                if (isDraft) {
                    result = await requestOrderService.submitDraftRequestOrder(route.query.draftId as string, payload, filesToSend);
                } else {
                    result = await requestOrderService.createRequestOrder(payload, filesToSend);
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

        const saveDraft = async () => {
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

            if (roNumber.value === 'New ID') {
                return;
            }

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
                    Items: getUngroupedItems().map((item) => {
                        const budgetItemId = item.budgetItemId;
                        const stats = budgetItemId != null ? itemStats.value[budgetItemId] : undefined;

                        return {
                            BudgetItemId: item.budgetItemId ?? null,
                            NonBudgetItemId: item.nonBudgetItemId ?? null,
                            StockItemId: item.nonBudgetItemId ?? null,
                            Description: item.description,
                            Uom: item.uom,
                            ItemCode: item.itemCode,
                            ItemType: item.itemType || 'CO',
                            Quantity: Number(item.qty.toFixed(2)),
                            OrgBgtQty: stats?.totalOrderedQty ?? 0,
                            BgtBalQty: stats?.totalBalance ?? 0,
                            TotalGrnQty: stats?.totalDeliveredQty ?? 0,
                            TotalPOQty: 0,
                            Rate: item.price ?? 0,
                            Notes: item.notes ?? '',
                            Reason: selectedReason.value || '',
                            DeliveryDate: item.deliveryDate ? formatDateToAPI(item.deliveryDate) : null
                        };
                    })
                };

                // add existing attachments
                const carryOvers = uploadFilesList.value.filter((uf: UploadFile) => uf.status === 'done').map((uf: UploadFile) => ({
                    filename: uf.name,
                    path: uf.id,
                    size: uf.size,
                    type: uf.type
                }));
                
                if (carryOvers.length > 0) {
                    payload.Attachment = JSON.stringify(carryOvers);
                }

                const filesToSend = uploadFilesList.value.filter(uf => uf.status !== 'done').map(uf => uf.file);

                let result;

                if (mode.value === 'edit-draft' && draftId.value) {
                    result = await requestOrderService.updateRequestOrderDraft(draftId.value, payload, filesToSend);
                } else {
                    result = await requestOrderService.createRequestOrderDraft(payload, filesToSend);
                }

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

        return {
            roNumber,
            budgetType,
            roDate,
            budgetOptions,
            calendarValue,
            tableColumns,
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
            uploadFilesList,
            totalSize,
            overallRemark,
            MAX_FILE_SIZE,
            showValidation,
            AutoComplete,
            searchSubcon,
            filteredSubconList,
            handleSubconSearch,
            selectedSubcon,
            noteModalItem,
            openNoteModal,
            updateNotes,
            handleNoteInput,
            invalidDeliveryByCode,
            onDeliveryDateChange,
            handleDeliveryInput,
            handleDeliveryPicker,
            currentProject,
            formatDateToAPI,

            openStockItemModal,
            showStockItemModal,
            handleStockItemsSelected,
            reasonOptions,
            selectedReason,
            projectId,
            globalDeliveryDate
        };
    }
});
