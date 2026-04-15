import { ProCard, ProTable, ProTag, ProTabs } from '@prosync_solutions/ui';
import { usePurchaseOrderStore } from '@/stores/purchase-order/purchaseOrder.store';
import { Motion } from '@motionone/vue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    name: 'ViewDetailsPO',
    components: { ProTag, ProCard, ProTable, ProTabs, Motion },
    setup() {
        const route = useRoute();
        const store = usePurchaseOrderStore();

        const poId = ref(route.query.id as string);
        const isLoading = ref(false);

        const purchaseOrder = computed(() => store.selectedPurchaseOrder);

        const project = ref<{ company: string; name: string } | null>(JSON.parse(localStorage.getItem('selectedProject') || 'null'));

        const poNumber = computed(() => purchaseOrder.value?.poNumber ?? 'N/A');
        const supplier = computed(() => purchaseOrder.value?.SupplierId?.toString() || 'N/A');
        const totalAmount = computed(() => {
            const amount = purchaseOrder.value?.TotalAmount;
            if (!amount && purchaseOrder.value?.items) {
                return purchaseOrder.value.items.reduce((sum, item) => sum + (item.amount || 0), 0);
            }
            return amount ?? 0;
        });

        const date = computed(() => purchaseOrder.value?.poDate ?? 'N/A');
        const status = computed(() => purchaseOrder.value?.Status ?? 'N/A');
        const createdBy = computed(() => purchaseOrder.value?.CreatedBy || 'N/A');

        const roNumber = computed(() => {
            const items = purchaseOrder.value?.items;
            if (!items || items.length === 0) return 'N/A';
            return items[0]?.note || items[0]?.RoDocNo || 'N/A';
        });

        const deliveryDate = computed(() => {
            const items = purchaseOrder.value?.items;
            if (!items || items.length === 0) return 'N/A';
            const date = items[0]?.deliveryDate || items[0]?.DeliveryDate;
            if (!date) return 'N/A';
            try {
                return new Date(date).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            } catch {
                return 'N/A';
            }
        });

        const itemsRemaining = computed(() => {
            if (!purchaseOrder.value?.items) return 0;
            const total = purchaseOrder.value.items.reduce((acc, item) => {
                const qty = Number(item.qty || item.Quantity || 0);
                const received = Math.floor(qty * 0.7);
                const remaining = qty - received;
                return acc + remaining;
            }, 0);
            return parseFloat(total.toFixed(2));
        });

        const itemsList = computed(() => {
            const items = purchaseOrder.value?.items;
            if (!items || items.length === 0) return [];

            return items.map((item) => {
                const qty = Number(item.qty || item.Quantity || 0);
                const unitPrice = Number(item.price || item.Price || 0);
                const amount = Number(item.amount || qty * unitPrice || 0);

                return {
                    no: 0,
                    code: item.code || item.ItemCode || '',
                    description: item.description || item.Name || '',
                    ordered: qty,
                    unitPrice,
                    amount: parseFloat(amount.toFixed(2)),
                    roNumber: item.note || item.RoDocNo || 'N/A',
                    deliveryDate: item.deliveryDate || item.DeliveryDate || 'N/A',
                    status: item.status || 'Pending'
                };
            });
        });

        const itemsWithNo = computed(() => itemsList.value.map((item, i) => ({ ...item, no: i + 1 })));

        // ProTable format: { key, label }
        const itemsColumns = ref([
            { key: 'no', label: 'No' },
            { key: 'code', label: 'Item Code' },
            { key: 'description', label: 'Description' },
            { key: 'ordered', label: 'Ordered' },
            { key: 'unitPrice', label: 'Unit Price' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' }
        ]);

        const activeTab = ref('items');
        const tabItems = [
            { key: 'items', label: 'Items' },
            { key: 'delivery', label: 'Delivery Orders' }
        ];

        // Helper: map status string to ProTag variant
        const getStatusVariant = (s: string): string => {
            const lower = s.toLowerCase();
            if (lower === 'completed') return 'success';
            if (lower === 'partially delivered') return 'warn';
            return 'info';
        };

        onMounted(async () => {
            isLoading.value = true;
            try {
                const result = await store.fetchPurchaseOrderById(poId.value);
            } catch (error) {
                console.error('Failed to load purchase order details:', error);
            } finally {
                isLoading.value = false;
            }
        });

        return {
            poNumber,
            supplier,
            totalAmount,
            date,
            status,
            createdBy,
            project,
            itemsWithNo,
            itemsColumns,
            activeTab,
            tabItems,
            isLoading,
            purchaseOrder,
            roNumber,
            deliveryDate,
            itemsRemaining,
            getStatusVariant
        };
    }
});
