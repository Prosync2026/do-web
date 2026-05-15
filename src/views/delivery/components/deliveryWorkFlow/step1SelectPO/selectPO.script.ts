import { usePurchaseOrderStore } from '@/stores/purchase-order/purchaseOrder.store';
import { PurchaseOrderCard } from '@/types/delivery.type';
import { useToast } from '@/utils/toastBus';
import { PhPackage, PhSparkle } from '@phosphor-icons/vue';
import Form, { FormSubmitEvent } from '@primevue/forms/form';
import { ProButton, ProCard, ProInput, ProTag } from '@prosync_solutions/ui';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { computed, defineComponent, onMounted, ref } from 'vue';

export default defineComponent({
    name: 'SelectPO',
    components: { Message, Toast, Form, ProCard, ProButton, ProTag, ProInput, PhPackage, PhSparkle },
    emits: ['update', 'next-step', 'prev-step', 'smartScan', 'smartScanManual'],
    setup(_, { emit }) {
        const toast = useToast();
        const purchaseStore = usePurchaseOrderStore();


        const selectedCard = ref<PurchaseOrderCard | null>(null);
        const manualSearch = ref('');
        const supplierSearch = ref('');

        const filteredCards = computed(() => {
            let data = purchaseStore.purchaseOrders.map((po: any) => ({
                id: po.Id?.toString() ?? '',
                title: po.DocNo ?? '',
                content: `${(po.purchase_order_items || po.PurchaseOrderItems)?.length ?? 0} items`,
                badges: (po.purchase_order_items || po.PurchaseOrderItems)?.map((i: any) => i.ItemCode ?? i.code ?? i.itemCode ?? '').filter(Boolean) ?? [],
                icon: 'pi-box',
                supplierName: po.supplier?.CompanyName || ''
            }));

            if (manualSearch.value.trim()) {
                const keyword = manualSearch.value.toLowerCase();
                data = data.filter((card) => card.title.toLowerCase().includes(keyword) || card.badges.some((b: string) => b.toLowerCase().includes(keyword)));
            }

            if (supplierSearch.value.trim()) {
                const supplierKeyword = supplierSearch.value.toLowerCase();
                data = data.filter((card) => card.supplierName.toLowerCase().includes(supplierKeyword));
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

        // clear handlers
        const handleClearSearch = async () => {
            manualSearch.value = '';
            selectedCard.value = null;
            const fullQuery = [manualSearch.value, supplierSearch.value].filter(Boolean).join(' ');
            purchaseStore.handleSearch(fullQuery); 
            await purchaseStore.fetchPurchaseOrders();
        };

        const handleClearSupplierSearch = async () => {
            supplierSearch.value = '';
            selectedCard.value = null;
            const fullQuery = [manualSearch.value, supplierSearch.value].filter(Boolean).join(' ');
            purchaseStore.handleSearch(fullQuery); 
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

        let searchTimeout: any;
        const triggerBackendSearch = (query: string) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                purchaseStore.handleSearch(query);
                await purchaseStore.fetchPurchaseOrders();
            }, 300);
        };

        const handleManualSearchInput = (value: string | Event) => {
            let query = '';
            if (typeof value === 'object' && value && 'target' in value) {
                query = ((value as Event).target as HTMLInputElement).value;
            } else if (typeof value === 'string') {
                query = value;
            } else {
                query = manualSearch.value;
            }
            manualSearch.value = query;
            const fullQuery = [manualSearch.value, supplierSearch.value].filter(Boolean).join(' ');
            triggerBackendSearch(fullQuery);
        };

        const handleSupplierSearchInput = (value: string | Event) => {
            let query = '';
            if (typeof value === 'object' && value && 'target' in value) {
                query = ((value as Event).target as HTMLInputElement).value;
            } else if (typeof value === 'string') {
                query = value;
            } else {
                query = supplierSearch.value;
            }
            supplierSearch.value = query;
            const fullQuery = [manualSearch.value, supplierSearch.value].filter(Boolean).join(' ');
            triggerBackendSearch(fullQuery);
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
            supplierSearchTerm: supplierSearch,
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
            manualSearch,
            supplierSearch,
            handlePageSizeChange,
            handleClearSearch,
            handleClearSupplierSearch,

            handleManualSearchInput,
            handleSupplierSearchInput
        };
    }
});
