import ReusableTable from '@/components/table/ReusableTable.vue';
import { deliveryOrderService } from '@/services/deliveryOrder.service';
import { requestOrderService } from '@/services/requestOrder.service';
import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import type { AttachmentItem } from '@/types/request-order.type';
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

        // Parse attachment JSON string
        const parsedAttachments = computed(() => {
            try {
                if (!singleDelivery.value?.Attachment) return [];
                const parsed = JSON.parse(singleDelivery.value.Attachment);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Error parsing Attachment:', e);
                return [];
            }
        });

        // Parse attachment2 JSON string
        const parsedAttachment2 = computed(() => {
            try {
                if (!singleDelivery.value?.Attachment2) return [];
                const parsed = JSON.parse(singleDelivery.value.Attachment2);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Error parsing Attachment2:', e);
                return [];
            }
        });

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

        function previewAttachment(file: AttachmentItem) {
            requestOrderService.previewAttachment(file);
        }

        function formatSize(size: number): string {
            if (!size) return '';
            const i = Math.floor(Math.log(size) / Math.log(1024));
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            return (size / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
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
            console.log('singleDelivery', singleDelivery.value);

            if (!singleDelivery.value) {
                showError('Failed to load delivery order details.');
                return;
            }

            items.value = formattedItems.value;
        });
        // preview attachment
        const attachments = ref<AttachmentItem[]>([]);

        onMounted(async () => {
            attachments.value = await deliveryOrderService.getAttachmentsByDeliveryId(deliveryId);
        });

        return {
            deliveryId,
            singleDelivery,
            loading,
            items,
            itemsColumns,
            onSearchWrapper: handleSearch,
            parsedAttachments,
            parsedAttachment2,
            formatSize,
            previewAttachment
        };
    }
});
