import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { computed, defineComponent, ref, toRaw, watch } from 'vue';

import ReusableTable from '@/components/table/ReusableTable.vue';
import { useStockItemStore } from '@/stores/budget/stockItem.store';
import type { StockItem } from '@/types/stockItem.type';
import type { TableColumn } from '@/types/table.type';
import { useToast } from 'primevue/usetoast';

export default defineComponent({
    name: 'CreateROStockItemModal',
    components: {
        Dialog,
        Button,
        InputText,
        Dropdown,
        Tag,
        ReusableTable
    },
    props: {
        visible: { type: Boolean, default: false }
    },
    emits: ['update:visible', 'items-selected'],
    setup(props, { emit }) {
        const stockStore = useStockItemStore();
        const toast = useToast();

        const searchTerm = ref('');
        const selectedCategory = ref<string | null>(null);
        const selectedElement = ref<string | null>(null);
        const selectedItemType = ref<string | null>(null);

        const selectedItems = ref<StockItem[]>([]);
        const deliveryDate = ref<Date | null>(null);
        const showValidation = ref(false);
        const loading = computed(() => stockStore.loading);
        const pagination = computed(() => stockStore.pagination);

        const fetchItems = async () => {
            await stockStore.fetchStockItems({
                page: pagination.value.page,
                pageSize: pagination.value.pageSize,
                category: selectedCategory.value || undefined,
                element: selectedElement.value || undefined,
                itemType: selectedItemType.value || undefined
            });
        };

        // Fetch items whenever the modal opens
        watch(
            () => props.visible,
            async (v) => {
                if (v) await fetchItems();
            }
        );

        // Watch search/filter changes
        watch([searchTerm, selectedCategory, selectedElement, selectedItemType], () => {
            pagination.value.page = 1;
            fetchItems();
        });

        const filteredItems = computed(() => {
            if (!searchTerm.value) return stockStore.items;
            const s = searchTerm.value.toLowerCase();
            return stockStore.items.filter((i) => i.itemCode.toLowerCase().includes(s) || i.name.toLowerCase().includes(s));
        });

        const closeModal = () => {
            emit('update:visible', false);
            selectedItems.value = [];
            deliveryDate.value = null;
            showValidation.value = false;
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

            const rawItems = toRaw(selectedItems.value);
            const rawDate = toRaw(deliveryDate.value);
            const items = JSON.parse(JSON.stringify(rawItems));

            const dateStr =
                rawDate instanceof Date
                    ? `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, '0')}-${String(rawDate.getDate()).padStart(2, '0')}`
                    : rawDate
                    ? String(rawDate)
                    : '';

            const itemsWithDeliveryDate = items.map((item: any) => ({
                ...item,
                deliveryDate: dateStr
            }));

            emit('items-selected', itemsWithDeliveryDate);
            closeModal();
        };

        const columns: TableColumn[] = [
            { field: 'itemCode', header: 'Item Code' },
            { field: 'name', header: 'Name' },
            { field: 'category', header: 'Category' },
            { field: 'element', header: 'Element' },
            { field: 'itemType', header: 'Item Type', bodySlot: 'itemTypeSlot' },
            { field: 'uom', header: 'UOM' }
        ];

        return {
            searchTerm,
            selectedCategory,
            selectedElement,
            selectedItemType,
            selectedItems,
            filteredItems,
            pagination,
            loading,
            columns,
            closeModal,
            deliveryDate,
            showValidation,
            addSelectedItems,
            handlePageChange: (p: number) => {
                pagination.value.page = p;
                fetchItems();
            },
            handlePageSizeChange: (ps: number) => {
                pagination.value.pageSize = ps;
                pagination.value.page = 1;
                fetchItems();
            }
        };
    }
});
