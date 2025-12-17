import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { computed, defineComponent, ref, watch } from 'vue';

import ReusableTable from '@/components/table/ReusableTable.vue';
import { useStockItemStore } from '@/stores/budget/stockItem.store';
import type { StockItem } from '@/types/stockItem.type';
import type { TableColumn } from '@/types/table.type';

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

        const searchTerm = ref('');
        const selectedCategory = ref<string | null>(null);
        const selectedElement = ref<string | null>(null);
        const selectedItemType = ref<string | null>(null);

        const selectedItems = ref<StockItem[]>([]);
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
        };

        const addSelectedItems = () => {
            emit('items-selected', [...selectedItems.value]);
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
