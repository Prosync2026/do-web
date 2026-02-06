import { usePurchaseOrderStore } from '@/stores/purchase-order/purchaseOrder.store';
import { PurchaseOrderCard } from '@/types/delivery.type';
import type { PurchaseOrderItem } from '@/types/purchase.type';
import Form, { FormSubmitEvent } from '@primevue/forms/form';
import AutoComplete from 'primevue/autocomplete';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref } from 'vue';

export default defineComponent({
    name: 'SelectPO',
    components: { AutoComplete, Card, Button, Message, Toast, Form, Badge },
    emits: ['update', 'next-step', 'prev-step'],
    setup(_, { emit }) {
        const toast = useToast();
        const purchaseStore = usePurchaseOrderStore();

        const selectedCard = ref<PurchaseOrderCard | null>(null);
        const manualSearch = ref('');

        const filteredCards = computed(() => {
            let data = purchaseStore.purchaseOrders.map((po) => ({
                id: po.Id?.toString() ?? '',
                title: po.DocNo ?? '',
                content: `${po.PurchaseOrderItems?.length ?? 0} items`,
                badges: po.PurchaseOrderItems?.map((i: PurchaseOrderItem) => i.ItemCode ?? '').filter(Boolean) ?? [],
                icon: 'pi-box'
            }));

            if (manualSearch.value.trim()) {
                const keyword = manualSearch.value.toLowerCase();
                data = data.filter((card) => card.title.toLowerCase().includes(keyword) || card.badges.some((b) => b.toLowerCase().includes(keyword)));
            }

            return data;
        });

        const pagination = computed(() => purchaseStore.pagination);

        const fetchPage = async () => {
            await purchaseStore.fetchPurchaseOrders();
        };

        onMounted(fetchPage);

        const handlePOSearch = async (event: { query: string }) => {
            const query = (event.query || '').trim();

            purchaseStore.handleSearch(query);
            await purchaseStore.fetchPurchaseOrders();

            manualSearch.value = query;
        };

        // clear handler
        const handleClearSearch = async () => {
            manualSearch.value = '';
            selectedCard.value = null;
            purchaseStore.handleSearch(''); // Clear store search
            await purchaseStore.fetchPurchaseOrders();
        };

        const toggleSelect = (card: PurchaseOrderCard) => {
            selectedCard.value = selectedCard.value?.id === card.id ? null : card;
        };

        const removeCard = (card: PurchaseOrderCard) => {
            if (selectedCard.value?.id === card.id) selectedCard.value = null;
        };

        const isSelected = (card: PurchaseOrderCard) => selectedCard.value?.id === card.id;

        const onFormSubmit = (event: FormSubmitEvent<Record<string, unknown>>) => {
            let hasError = false;

            if (!event.valid) {
                toast.add({
                    severity: 'warn',
                    summary: 'Form Incomplete',
                    detail: 'Please fill in all required fields.',
                    life: 2500
                });
                hasError = true;
            }

            if (!selectedCard.value) {
                toast.add({
                    severity: 'warn',
                    summary: 'No PO Selected',
                    detail: 'Please select a Purchase Order before continuing.',
                    life: 2500
                });
                hasError = true;
            }

            if (hasError) return;

            const fullPO = purchaseStore.purchaseOrders.find((po) => po.Id.toString() === selectedCard.value?.id);

            if (!fullPO) return;

            const items = fullPO.purchase_order_items ?? fullPO.PurchaseOrderItems ?? [];

            emit('update', {
                id: fullPO.Id,
                poNumber: fullPO.DocNo,
                items: items
            });

            emit('next-step');

            toast.add({
                severity: 'info',
                summary: 'Purchase Order Confirmed',
                detail: `Selected PO: ${fullPO.DocNo}`,
                life: 2000
            });
        };

        const displayStart = computed(() => {
            const page = purchaseStore.pagination?.page ?? 1;
            const pageSize = purchaseStore.pagination?.pageSize ?? 10;
            return (page - 1) * pageSize + 1;
        });

        const displayEnd = computed(() => {
            const page = purchaseStore.pagination?.page ?? 1;
            const pageSize = purchaseStore.pagination?.pageSize ?? 10;
            const total = purchaseStore.pagination?.total ?? 0;
            return Math.min(page * pageSize, total);
        });

        const setPage = (page: number) => {
            purchaseStore.setPage(page);
        };

        const setPageSize = (pageSize: number) => {
            purchaseStore.setPageSize(pageSize);
        };

        const handleManualSearch = () => {
            // just update manualSearch ref
        };

        const handlePageSizeChange = (event: Event) => {
            const target = event.target as HTMLSelectElement;
            if (target?.value) {
                setPageSize(Number(target.value));
            }
        };

        return {
            selectedCard,
            filteredCards,
            searchTerm: manualSearch,
            handlePOSearch,
            toggleSelect,
            removeCard,
            isSelected,
            onFormSubmit,
            pagination,
            setPage,
            setPageSize,
            displayStart,
            displayEnd,
            purchaseStore,
            handleManualSearch,
            manualSearch,
            handlePageSizeChange,
            handleClearSearch
        };
    }
});
