import ReusableTable from '@/components/table/ReusableTable.vue';
import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import { showError } from '@/utils/showNotification.utils';
import { Motion } from '@motionone/vue';
import { storeToRefs } from 'pinia';
import Tag from 'primevue/tag';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    name: 'ViewDelivery',
    components: { Tag, ReusableTable, Motion },
    setup() {
        const route = useRoute();
        const deliveryStore = useDeliveryStore();
        const { singleDelivery, loading } = storeToRefs(deliveryStore);

        const search = ref('');
        const items = ref<any[]>([]);

        const deliveryId = Number(route.params.deliveryOrderId);

        const itemsColumns = ref([
            { field: 'no', header: 'No', bodySlot: 'no' },
            { field: 'ItemCode', header: 'Item Code' },
            { field: 'Name', header: 'Description' },
            { field: 'Uom', header: 'UOM' },
            { field: 'Quantity', header: 'Quantity' },
            { field: 'DeliveryDate', header: 'Delivery Date' },
            { field: 'status', header: 'Status', bodySlot: 'status' }
        ]);

        const formattedItems = computed(() =>
            (singleDelivery.value?.delivery_order_items || []).map((item, index) => ({
                no: index + 1,
                ...item,
                status: Number(item.Quantity) > 0 ? 'Pending' : 'Completed'
            }))
        );

        function handleSearch(value: string) {
            search.value = value.trim().toLowerCase();
            if (!search.value) {
                items.value = formattedItems.value;
                return;
            }

            items.value = formattedItems.value.filter((i) => i.ItemCode.toLowerCase().includes(search.value) || i.Name.toLowerCase().includes(search.value));
        }

        watch(singleDelivery, () => {
            items.value = formattedItems.value;
        });

        onMounted(async () => {
            if (!deliveryId || isNaN(deliveryId)) {
                showError('Invalid delivery ID in route.');
                return;
            }

            await deliveryStore.getSingleDeliveryOrder(deliveryId);

            if (!singleDelivery.value) {
                showError('Failed to load delivery order details.');
                return;
            }

            items.value = formattedItems.value;
        });

        return {
            deliveryId,
            singleDelivery,
            loading,
            items,
            itemsColumns,
            onSearchWrapper: handleSearch
        };
    }
});
