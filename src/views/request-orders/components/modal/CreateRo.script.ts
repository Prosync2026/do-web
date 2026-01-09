import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';

import ReusableTable from '@/components/table/ReusableTable.vue';
import { budgetFilterService } from '@/services/budgetFilter.service';
import { useBudgetStore } from '@/stores/budget/budget.store';
import type { TableColumn } from '@/types/table.type';
import { useToast } from 'primevue/usetoast';
import type { BudgetItem, FilterOption } from '../../../../types/request-order.type';

export default defineComponent({
    name: 'CreateROModal',
    components: {
        Dialog,
        ReusableTable,
        Button,
        InputText,
        Dropdown,
        Tag
    },
    props: {
        visible: { type: Boolean, default: false },
        projectId: { type: Number, required: true },
        version: { type: Number, required: true }
    },
    emits: ['update:visible', 'items-selected'],
    setup(props, { emit }) {
        const localVisible = ref(props.visible);
        watch(
            () => props.visible,
            (val) => {
                if (localVisible.value !== val) {
                    localVisible.value = val;
                }
            }
        );
        const toast = useToast();
        const modalTitle = ref('Add Bulk Items from Budget');
        const loading = ref(false);

        // Filter state
        const searchTerm = ref('');
        const selectedLocation1 = ref<string | null>(null);
        const selectedLocation2 = ref<string | null>(null);
        const selectedCategory = ref<string | null>(null);
        const selectedElement = ref<string | null>(null);
        const selectedSubElement = ref<string | null>(null);
        const selectedSubSubElement = ref<string | null>(null);
        const selectedItemCode = ref<string | null>(null);
        const selectedStatus = ref<string | null>(null);

        // Filter options from backend
        const location1Options = ref<FilterOption[]>([]);
        const location2Options = ref<FilterOption[]>([]);
        const elementOptions = ref<FilterOption[]>([]);
        const subElementOptions = ref<FilterOption[]>([]);
        const subSubElementOptions = ref<FilterOption[]>([]);
        const categoryOptions = ref<FilterOption[]>([]);
        const statusOptions = ref<FilterOption[]>([]);

        const deliveryDate = ref<Date | null>(null);
        const showValidation = ref(false);

        const onSubElementClick = () => {
            if (!selectedElement.value) {
                toast.add({ severity: 'warn', summary: 'Attention', detail: 'Please select an Element first.', life: 3000 });
                return false;
            }
            return true;
        };

        const onSubSubElementClick = () => {
            if (!selectedElement.value || !selectedSubElement.value) {
                toast.add({ severity: 'warn', summary: 'Attention', detail: 'Please select Element and Sub Element first.', life: 3000 });
                return false;
            }
            return true;
        };

        const onLocation2Click = () => {
            if (!selectedLocation1.value) {
                toast.add({ severity: 'warn', summary: 'Attention', detail: 'Please select Location 1 first.', life: 3000 });
                return false;
            }
            return true;
        };

        const selectedItems = ref<BudgetItem[]>([]);

        const budgetStore = useBudgetStore();
        const currentVersion = ref<number | null>(props.version || Number(localStorage.getItem('latestBudgetVersion')));

        const fetchBudgetItems = async (page: number = 1, pageSize: number = budgetStore.pagination.pageSize) => {
            if (!currentVersion.value) return;

            await budgetStore.fetchBudgetItems({
                budgetId: currentVersion.value,
                search: searchTerm.value || undefined,
                category: selectedCategory.value || undefined,
                element: selectedElement.value || undefined,
                subElement: selectedSubElement.value || undefined,
                subSubElement: selectedSubSubElement.value || undefined,
                location1: selectedLocation1.value || undefined,
                location2: selectedLocation2.value || undefined,
                itemCode: selectedItemCode.value || undefined,
                status: selectedStatus.value || undefined,
                page,
                pageSize
            });
        };

        const pagination = computed(() => budgetStore.pagination);
        const allBudgetItems = computed(() => budgetStore.budgetItems);

        watch(allBudgetItems, (items) => {
            const cats = [...new Set(items.map((i) => i.category))];
            categoryOptions.value = cats.map((c) => ({ label: c, value: c }));

            const stats = [...new Set(items.map((i) => i.status))];
            statusOptions.value = stats.map((s) => ({ label: s, value: s }));
        });

        const hasActiveFilters = computed(
            () => !!(searchTerm.value || selectedCategory.value || selectedElement.value || selectedSubElement.value || selectedLocation1.value || selectedLocation2.value || selectedItemCode.value || selectedStatus.value)
        );

        const closeModal = () => {
            // Reset all state when closing
            selectedItems.value = [];
            deliveryDate.value = null;
            showValidation.value = false;
            emit('update:visible', false);
        };

        const resetModal = () => {
            selectedItems.value = [];
            deliveryDate.value = null;
            clearFilters();
        };

        const clearFilters = async () => {
            searchTerm.value = '';
            selectedCategory.value = null;
            selectedElement.value = null;
            selectedSubElement.value = null;
            selectedLocation1.value = null;
            selectedLocation2.value = null;
            selectedItemCode.value = null;
            selectedStatus.value = null;
            budgetStore.pagination.page = 1;
            await fetchBudgetItems(1);
        };

        const addSelectedItems = () => {
            showValidation.value = true;

            if (selectedItems.value.length === 0) {
                toast.add({
                    severity: 'warn',
                    summary: 'No Items Selected',
                    detail: 'Please select at least one item.',
                    life: 3000
                });
                return;
            }

            if (!deliveryDate.value) {
                toast.add({
                    severity: 'warn',
                    summary: 'Delivery Date Required',
                    detail: 'Please select a delivery date before adding items.',
                    life: 3000
                });
                return;
            }

            // Create a copy of selected items before clearing
            const itemsToCopy = [...selectedItems.value];

            // Clear immediately to prevent reactivity issues
            selectedItems.value = [];

            // Build the items with delivery date
            const itemsWithDeliveryDate = itemsToCopy.map((item) => ({
                id: item.id,
                itemCode: item.itemCode,
                itemType: item.itemType,
                description: item.description,
                location: item.location,
                location1: item.location1,
                location2: item.location2,
                uom: item.uom,
                qty: item.qty,
                price: item.rate,
                deliveryDate: deliveryDate.value ? new Date(deliveryDate.value) : null,
                isBudgeted: true
            }));

            emit('items-selected', itemsWithDeliveryDate);
            closeModal();
        };

        const getItemTypeSeverity = (itemType: string): string => {
            const severityMap: Record<string, string> = {
                Materials: 'info',
                Labour: 'warning',
                Equipment: 'success',
                Installation: 'secondary'
            };
            return severityMap[itemType] || 'info';
        };

        const loadFilterOptions = async () => {
            const loc1 = await budgetFilterService.getLocation1();
            location1Options.value = loc1.map((l) => ({ label: l, value: l }));

            const els = await budgetFilterService.getElements();
            elementOptions.value = els.map((e) => ({ label: e, value: e }));
        };

        watch(selectedLocation1, async (val) => {
            if (val) {
                const loc2 = await budgetFilterService.getLocation2(val);
                location2Options.value = loc2.map((l) => ({ label: l, value: l }));
            } else {
                location2Options.value = [];
                selectedLocation2.value = null;
            }
        });

        watch(selectedElement, async (val) => {
            if (val) {
                const subs = await budgetFilterService.getSubElements(val);
                subElementOptions.value = subs.map((s) => ({ label: s, value: s }));
                subSubElementOptions.value = [];
                selectedSubElement.value = null;
                selectedSubSubElement.value = null;
            } else {
                subElementOptions.value = [];
                subSubElementOptions.value = [];
                selectedSubElement.value = null;
                selectedSubSubElement.value = null;
            }
        });

        watch(selectedSubElement, async (val) => {
            if (val && selectedElement.value) {
                const subsSub = await budgetFilterService.getSubSubElements(selectedElement.value, val);
                subSubElementOptions.value = subsSub.map((s) => ({ label: s, value: s }));
                selectedSubSubElement.value = null;
            } else {
                subSubElementOptions.value = [];
                selectedSubSubElement.value = null;
            }
        });

        watch(localVisible, async (visible) => {
            if (visible) {
                if (!currentVersion.value) currentVersion.value = Number(localStorage.getItem('latestBudgetVersion'));
                if (currentVersion.value) {
                    await fetchBudgetItems();
                    await loadFilterOptions();
                }
            }
        });

        let filterTimeout: ReturnType<typeof setTimeout>;
        const debouncedFetchOnFilter = () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(async () => {
                budgetStore.pagination.page = 1;
                await fetchBudgetItems(1);
            }, 500);
        };

        watch([searchTerm, selectedCategory, selectedElement, selectedSubElement, selectedSubSubElement, selectedLocation1, selectedLocation2, selectedItemCode, selectedStatus], () => {
            budgetStore.pagination.page = 1;
            debouncedFetchOnFilter();
        });

        const handlePageChange = async (page: number) => {
            await fetchBudgetItems(page, budgetStore.pagination.pageSize);
        };

        const handlePageSizeChange = async (pageSize: number) => {
            budgetStore.pagination.pageSize = pageSize;
            await fetchBudgetItems(1, pageSize);
        };

        const grandTotal = computed(() => {
            return selectedItems.value.reduce((sum, item) => sum + Number(item.rate ?? 0) * Number(item.qty ?? 0), 0);
        });

        // return the store data directly
        const paginatedItems = computed(() => {
            const items = budgetStore.budgetItems || [];
            // create new objects
            items.forEach((item: any, index) => {
                item.rowIndex = (budgetStore.pagination.page - 1) * budgetStore.pagination.pageSize + index + 1;
            });
            return items;
        });

        const columns: TableColumn[] = [
            { field: 'rowIndex', header: '#', sortable: false },
            { field: 'itemCode', header: 'Item Code', sortable: true },
            { field: 'description', header: 'Description', sortable: true },
            { field: 'location1', header: 'Location 1', sortable: false },
            { field: 'location2', header: 'Location 2', sortable: false },
            { field: 'category', header: 'Category', sortable: true },
            { field: 'elementCode', header: 'Element', sortable: true },
            { field: 'subElement', header: 'Sub Element', sortable: true },
            { field: 'subSubElement', header: 'Sub Sub Element', sortable: true },
            { field: 'uom', header: 'UOM', sortable: false },
            { field: 'qty', header: 'Quantity', sortable: true },
            { field: 'rate', header: 'Rate', sortable: true, bodySlot: 'rateSlot', visible: false },
            { field: 'amount', header: 'Amount', bodySlot: 'amountSlot', visible: false }
        ];

        onMounted(async () => {
            if (currentVersion.value) {
                await budgetStore.fetchBudgets(currentVersion.value);
                await loadFilterOptions();
            }
        });

        return {
            modalTitle,
            loading,
            localVisible,
            paginatedItems,
            selectedItems,
            allBudgetItems,
            categoryOptions,
            elementOptions,
            subElementOptions,
            subSubElementOptions,
            location1Options,
            location2Options,
            statusOptions,
            pagination,
            grandTotal,
            hasActiveFilters,
            closeModal,
            clearFilters,
            addSelectedItems,
            getItemTypeSeverity,
            handlePageChange,
            handlePageSizeChange,
            onLocation2Click,
            onSubElementClick,
            onSubSubElementClick,
            searchTerm,
            selectedCategory,
            selectedElement,
            selectedSubElement,
            selectedSubSubElement,
            selectedLocation1,
            selectedLocation2,
            selectedItemCode,
            selectedStatus,
            columns,
            deliveryDate,
            showValidation
        };
    }
});
