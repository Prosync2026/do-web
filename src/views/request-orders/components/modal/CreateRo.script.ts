import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';

import ReusableTable from '@/components/table/ReusableTable.vue';
import { useBudgetStore } from '@/stores/budget/budget.store';
import type { TableColumn } from '@/types/table.type';
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
            (val) => (localVisible.value = val)
        );
        watch(localVisible, (val) => emit('update:visible', val));

        const modalTitle = ref('Add Bulk Items from Budget');
        const loading = ref(false);

        const searchTerm = ref('');
        const selectedLocation = ref<string | null>(null);
        const selectedElement = ref<string | null>(null);
        const selectedItemType = ref<string | null>(null);

        // Selection - PrimeVue expects array, so use array directly
        const selectedItems = ref<BudgetItem[]>([]);

        // Budget store
        const budgetStore = useBudgetStore();

        const loadLatestBudgetVersion = (): number | null => {
            const v = localStorage.getItem('latestBudgetVersion');
            return v ? Number(v) : null;
        };

        const currentVersion = ref<number | null>(props.version || loadLatestBudgetVersion());

        const fetchBudgetItems = async () => {
            if (!currentVersion.value) return;
            loading.value = true;
            try {
                await budgetStore.fetchBudgetItems(currentVersion.value, budgetStore.pagination.page, budgetStore.pagination.pageSize);
            } catch (error) {
                console.error('Error loading budget items:', error);
            } finally {
                loading.value = false;
            }
        };

        // Use store's pagination directly
        const pagination = computed(() => budgetStore.pagination);

        // All budget items from store
        const allBudgetItems = computed(() => budgetStore.budgetItems);

        const filteredItems = computed(() => {
            let items = [...allBudgetItems.value];

            if (searchTerm.value) {
                const search = searchTerm.value.toLowerCase();
                items = items.filter((item) => item.itemCode.toLowerCase().includes(search) || item.description.toLowerCase().includes(search));
            }
            if (selectedLocation.value) {
                items = items.filter((item) => item.location === selectedLocation.value);
            }
            if (selectedElement.value) {
                items = items.filter((item) => item.element === selectedElement.value);
            }
            if (selectedItemType.value) {
                items = items.filter((item) => item.itemType === selectedItemType.value);
            }

            return items;
        });

        // Update pagination when filters change
        watch([searchTerm, selectedLocation, selectedElement, selectedItemType], async () => {
            budgetStore.pagination.page = 1;
        });

        watch(
            () => allBudgetItems.value,
            (newItems) => {
                const validIds = new Set(newItems.map((item) => item.id));
                selectedItems.value = selectedItems.value.filter((selected) => validIds.has(selected.id));
            }
        );

        const grandTotal = computed(() => {
            return selectedItems.value.reduce((sum, item) => sum + (item.price ?? 0) * (item.qty ?? 0), 0);
        });

        const locationOptions = computed<FilterOption[]>(() => {
            const locations = [...new Set(allBudgetItems.value.map((item) => item.location))];
            return locations.map((loc) => ({ label: loc, value: loc }));
        });

        const elementOptions = computed<FilterOption[]>(() => {
            const elements = [...new Set(allBudgetItems.value.map((item) => item.element))];
            return elements.map((el) => ({ label: el, value: el }));
        });

        // const itemTypeOptions = computed<FilterOption[]>(() => {
        //     const types = [...new Set(allBudgetItems.value.map((item) => item.itemType))];
        //     return types.map((type) => ({ label: type, value: type }));
        // });

        const filterOptions = computed(() => [
            { type: 'select' as const, field: 'location', placeholder: 'Filter by Location', options: locationOptions.value },
            { type: 'select' as const, field: 'element', placeholder: 'Filter by Element', options: elementOptions.value },
            { type: 'select' as const, field: 'itemType', placeholder: 'Filter by Item Type', options: elementOptions.value }
        ]);

        const hasActiveFilters = computed(() => !!(searchTerm.value || selectedLocation.value || selectedElement.value || selectedItemType.value));

        const closeModal = () => {
            emit('update:visible', false);
            resetModal();
        };

        const resetModal = () => {
            selectedItems.value = [];
            clearFilters();
        };

        const clearFilters = () => {
            searchTerm.value = '';
            selectedLocation.value = null;
            selectedElement.value = null;
            selectedItemType.value = null;
            budgetStore.pagination.page = 1;
        };

        const addSelectedItems = () => {
            if (selectedItems.value.length > 0) {
                emit('items-selected', [...selectedItems.value]);
                closeModal();
            }
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

        watch(localVisible, async (visible) => {
            if (visible) {
                if (!currentVersion.value) {
                    currentVersion.value = loadLatestBudgetVersion();
                }
                if (currentVersion.value) {
                    await fetchBudgetItems();
                }
            }
        });

        const handlePageChange = async (page: number) => {
            budgetStore.pagination.page = page;
            await fetchBudgetItems();
        };

        const handlePageSizeChange = async (pageSize: number) => {
            budgetStore.pagination.pageSize = pageSize;
            budgetStore.pagination.page = 1;
            await fetchBudgetItems();
        };

        // Add rowIndex to items
        const paginatedItems = computed(() => {
            return budgetStore.budgetItems.map((item, index) => ({
                ...item,
                rowIndex: (budgetStore.pagination.page - 1) * budgetStore.pagination.pageSize + index + 1
            }));
        });

        const handleSearch = (value: string) => {
            searchTerm.value = value;
            budgetStore.pagination.page = 1;
        };

        const handleFilterChange = (filters: Record<string, any>) => {
            selectedLocation.value = filters.location || null;
            selectedElement.value = filters.element || null;
            selectedItemType.value = filters.itemType || null;
            budgetStore.pagination.page = 1;
        };

        // Define ReusableTable columns
        const columns: TableColumn[] = [
            { field: 'rowIndex', header: '#', sortable: false },
            { field: 'itemCode', header: 'Item Code', sortable: true },
            { field: 'description', header: 'Description', sortable: true },
            { field: 'location', header: 'Location', sortable: false },
            { field: 'element', header: 'Element', sortable: false },
            { field: 'itemType', header: 'Item Type', sortable: true, bodySlot: 'itemTypeSlot' },
            { field: 'uom', header: 'UOM', sortable: false },
            { field: 'qty', header: 'Quantity', sortable: true },
            { field: 'price', header: 'Price', sortable: true, bodySlot: 'priceSlot', visible: false },
            { field: 'total', header: 'Total', bodySlot: 'totalSlot', visible: false }
        ];

        onMounted(() => {
            budgetStore.fetchBudgets();
        });

        const displayItems = computed(() => {
            // Don't create new objects - mutate the existing ones with rowIndex
            budgetStore.budgetItems.forEach((item, index) => {
                (item as any).rowIndex = (budgetStore.pagination.page - 1) * budgetStore.pagination.pageSize + index + 1;
            });
            return budgetStore.budgetItems;
        });

        return {
            modalTitle,
            loading,
            localVisible,
            paginatedItems: displayItems,
            filteredItems,
            selectedItems,
            allBudgetItems,
            locationOptions,
            elementOptions,
            //itemTypeOptions,
            pagination,
            filterOptions,
            grandTotal,
            hasActiveFilters,
            closeModal,
            clearFilters,
            addSelectedItems,
            getItemTypeSeverity,
            handlePageChange,
            handlePageSizeChange,
            handleSearch,
            handleFilterChange,
            columns,
            searchTerm,
            selectedLocation,
            selectedElement,
            selectedItemType
        };
    }
});
