import { getStockItems } from '@/services/stockItem.service';
import type { StockItem } from '@/types/stockItem.type';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStockItemStore = defineStore('stockItem', () => {
    const items = ref<StockItem[]>([]);
    const pagination = ref({
        total: 0,
        totalPages: 1,
        page: 1,
        pageSize: 10
    });
    const loading = ref(false);

    async function fetchStockItems(filters?: { category?: string; itemType?: string; itemGroup?: string; itemCategory?: string; element?: string; page?: number; pageSize?: number }) {
        loading.value = true;
        try {
            const res = await getStockItems(filters);
            if (!res.success) return;

            items.value = res.data.map((i: any) => ({
                id: i.Id,
                category: i.Category,
                itemType: i.ItemType,
                itemCode: i.ItemCode,
                name: i.Name,
                description: i.Description,
                quantity: Number(i.Quantity),
                uom: i.Uom,
                itemGroup: i.ItemGroup,
                itemCategory: i.ItemCategory,
                element: i.Element,
                subElement: i.SubElement,
                subSubElement: i.SubSubElement,
                isActive: i.IsActive
            }));

            pagination.value = res.pagination;
        } finally {
            loading.value = false;
        }
    }

    return {
        items,
        pagination,
        loading,
        fetchStockItems
    };
});
