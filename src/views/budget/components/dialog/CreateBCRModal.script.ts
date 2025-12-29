import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { computed, defineComponent, ref, watch } from 'vue';

import ReusableTable from '@/components/table/ReusableTable.vue';
import { useBudgetStore } from '@/stores/budget/budget.store';
import type { BudgetItem, FilterOption } from '@/types/request-order.type';
import type { TableColumn } from '@/types/table.type';

export default defineComponent({
    name: 'CreateBCRModal',
    components: { Dialog, Button, InputText, Dropdown, Tag, ReusableTable },
    props: {
        visible: { type: Boolean, required: true },
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

        const modalTitle = ref('Add Items from Budget');
        const loading = ref(false);

        // Selection & Filters
        const selectedItems = ref<BudgetItem[]>([]);
        const searchTerm = ref('');
        const selectedLocation = ref<string | null>(null);
        const selectedElement = ref<string | null>(null);
        const selectedItemType = ref<string | null>(null);

        // Pagination
        const pagination = ref({
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0
        });

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
                await budgetStore.fetchBudgetItems(currentVersion.value, pagination.value.page, pagination.value.pageSize);
                pagination.value.total = budgetStore.pagination.total;
                pagination.value.totalPages = budgetStore.pagination.totalPages;
            } catch (error) {
                console.error('Error fetching budget items:', error);
            } finally {
                loading.value = false;
            }
        };

        // Computed items & filters
        const allBudgetItems = computed(() => budgetStore.budgetItems);

        const filteredItems = computed(() => {
            let items = [...allBudgetItems.value];

            if (searchTerm.value) {
                const s = searchTerm.value.toLowerCase();
                items = items.filter((i) => i.itemCode.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
            }
            if (selectedLocation.value) items = items.filter((i) => i.location === selectedLocation.value);
            if (selectedElement.value) items = items.filter((i) => i.element === selectedElement.value);
            if (selectedItemType.value) items = items.filter((i) => i.itemType === selectedItemType.value);

            return items;
        });

        const paginatedItems = computed(() => {
            return filteredItems.value.map((item, index) => ({
                ...item,
                Id: item.id || item.itemCode || index,
                rowIndex: index + 1 + (pagination.value.page - 1) * pagination.value.pageSize
            }));
        });

        const grandTotal = computed(() => selectedItems.value.reduce((sum, item) => sum + (item.price ?? 0) * (item.qty ?? 0), 0));

        const locationOptions = computed<FilterOption[]>(() => [...new Set(allBudgetItems.value.map((i) => i.location))].map((l) => ({ label: l || 'N/A', value: l })));

        const elementOptions = computed<FilterOption[]>(() => [...new Set(allBudgetItems.value.map((i) => i.element))].map((e) => ({ label: e || 'N/A', value: e })));

        const itemTypeOptions = computed<FilterOption[]>(() => [...new Set(allBudgetItems.value.map((i) => i.itemType).filter((t): t is string => !!t))].map((t) => ({ label: t, value: t })));

        const hasActiveFilters = computed(() => !!(searchTerm.value || selectedLocation.value || selectedElement.value || selectedItemType.value));

        const clearFilters = () => {
            searchTerm.value = '';
            selectedLocation.value = null;
            selectedElement.value = null;
            selectedItemType.value = null;
            pagination.value.page = 1;
        };

        const closeModal = () => {
            emit('update:visible', false);
            selectedItems.value = [];
            clearFilters();
        };

        const addSelectedItems = () => {
            if (selectedItems.value.length > 0) {
                console.log('selected items', selectedItems.value);
                emit('items-selected', [...selectedItems.value]);
                closeModal();
            }
        };

        const handlePageChange = async (page: number) => {
            pagination.value.page = page;
            await fetchBudgetItems();
        };

        const handlePageSizeChange = async (pageSize: number) => {
            pagination.value.pageSize = pageSize;
            pagination.value.page = 1;
            await fetchBudgetItems();
        };

        const getItemTypeSeverity = (itemType: string) => {
            const map: Record<string, string> = {
                Materials: 'info',
                Labour: 'warning',
                Equipment: 'success',
                Installation: 'secondary'
            };
            return map[itemType] || 'info';
        };

        watch(localVisible, async (visible) => {
            if (visible) {
                if (!currentVersion.value) {
                    // fallback in case version not set
                    currentVersion.value = loadLatestBudgetVersion();
                }
                if (currentVersion.value) {
                    await fetchBudgetItems();
                }
            }
        });

        // Table columns
        const columns: TableColumn[] = [
            { field: 'rowIndex', header: '#' },
            { field: 'itemCode', header: 'Item Code', sortable: true },
            { field: 'description', header: 'Description', sortable: true },
            { field: 'location', header: 'Location' },
            { field: 'element', header: 'Element' },
            { field: 'itemType', header: 'Item Type', bodySlot: 'itemType' },
            { field: 'uom', header: 'UoM' },
            { field: 'qty', header: 'Qty' },
            { field: 'price', header: 'Unit Price', bodySlot: 'priceSlot' },
            { field: 'total', header: 'Total', bodySlot: 'totalSlot' }
        ];

        return {
            localVisible,
            modalTitle,
            loading,
            selectedItems,
            searchTerm,
            selectedLocation,
            selectedElement,
            selectedItemType,
            pagination,
            filteredItems,
            paginatedItems,
            allBudgetItems,
            grandTotal,
            locationOptions,
            elementOptions,
            itemTypeOptions,
            hasActiveFilters,
            columns,
            clearFilters,
            closeModal,
            addSelectedItems,
            handlePageChange,
            handlePageSizeChange,
            getItemTypeSeverity
        };
    }
});
