import ReusableTable from '@/components/table/ReusableTable.vue';
import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import type { DeliveryFlow } from '@/types/delivery.type';
import type { TableColumn } from '@/types/table.type';
import Form from '@primevue/forms/form';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Card from 'primevue/card';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'Review',
    components: {
        Card,
        InputText,
        Button,
        Message,
        Toast,
        Form,
        Calendar,
        Textarea,
        FileUpload,
        ProgressBar,
        Badge,
        ReusableTable
    },
    emits: ['update', 'next-step', 'prev-step'],
    props: {
        deliveryData: {
            type: Object as () => DeliveryFlow,
            required: true
        }
    },
    setup(props, { emit }) {
        // ---------------------------
        // 1. DATA
        // ---------------------------
        const deliveryInfo = ref<DeliveryFlow['deliveryInfo'] | null>(props.deliveryData.deliveryInfo ?? null);
        const selectPO = ref<DeliveryFlow['selectPO'] | null>(props.deliveryData.selectPO ?? null);
        const verifyItem = ref<DeliveryFlow['verifyItem']>(props.deliveryData.verifyItem ?? []);

        const toast = useToast();
        const router = useRouter();
        const deliveryStore = useDeliveryStore();

        const toastRef = ref<InstanceType<typeof Toast> | null>(null);

        const deliveryListColumn: TableColumn[] = [
            { field: 'ItemCode', header: 'Item Code', sortable: true },
            { field: 'SoDocNo', header: 'DO No.', sortable: true },
            { field: 'Name', header: 'Item Name', sortable: true },
            { field: 'Price', header: 'Unit Price' },
            { field: 'Quantity', header: 'Quantity' }
        ];

        // ---------------------------
        // 2. COMPUTED
        // ---------------------------

        // for ReusableTable
        const deliveredItems = computed(() => {
            const po = selectPO.value;
            if (!po || !po.PurchaseOrderItems) return [];

            return po.PurchaseOrderItems.map((item: any) => ({
                ItemCode: item.ItemCode ?? item.code ?? item.itemCode,
                Name: item.Name ?? item.description ?? item.name,
                Price: item.Price ?? item.price,
                Quantity: Number(item.Quantity ?? item.qty),
                Uom: item.Uom ?? item.uom,
                SoDocNo: item.SoDocNo ?? po.DocNo
            }));
        });

        const hasDeliveredItems = computed(() => deliveredItems.value.length > 0);

        const formatDate = (dateStr?: string) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toISOString().split('T')[0];
        };

        // ---------------------------
        // 3. SUBMIT FUNCTION
        // ---------------------------

        const onFormSubmit = async (event: { valid: boolean; originalEvent: Event }) => {
            // Prevent native form submission
            event.originalEvent?.preventDefault?.();

            if (!deliveryInfo.value || !selectPO.value) {
                toast.add({
                    severity: 'warn',
                    summary: 'Missing Data',
                    detail: 'Please complete delivery info and PO selection before submitting.',
                    life: 3000
                });
                return;
            }

            const payload = {
                PurchaseOrderId: selectPO.value.id ?? selectPO.value.purchaseOrderId,
                DocNo: selectPO.value.poNumber ?? selectPO.value.DocNo,
                Date: deliveryInfo.value.Date,
                PlateNo: deliveryInfo.value.PlateNo,
                Remarks: deliveryInfo.value.Remarks,
                DeliveryDate: deliveryInfo.value.DeliveryDate,
                Items: JSON.stringify(
                    verifyItem.value.map((item) => ({
                        PurchaseOrderItemId: item.purchaseOrderItemId,
                        RequestOrderItemId: item.requestOrderId,
                        Quantity: item.quantity
                    }))
                )
            };

            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });

            // Handle attachment
            if (deliveryInfo.value.attachments?.length) {
                deliveryInfo.value.attachments.forEach((file) => formData.append('attachments', file));
            }

            // Handle attachments2
            if (deliveryInfo.value.attachments2?.length) {
                deliveryInfo.value.attachments2.forEach((file) => formData.append('attachments2', file));
            }

            try {
                const success = await deliveryStore.createDeliveryOrder(formData);
                if (success) router.push('/deliveries');
            } catch (err) {
                console.error(err);
            }
        };

        // ---------------------------
        // 4. WATCH
        // ---------------------------
        watch(
            () => props.deliveryData,
            (newData) => {
                deliveryInfo.value = newData.deliveryInfo ?? null;
                if (newData.selectPO) {
                    selectPO.value = {
                        id: newData.selectPO.id ?? newData.selectPO.purchaseOrderId,
                        poNumber: newData.selectPO.poNumber ?? newData.selectPO.DocNo ?? '',
                        DocNo: newData.selectPO.DocNo ?? '',
                        purchaseOrderId: newData.selectPO.purchaseOrderId ?? newData.selectPO.id ?? 0,
                        PurchaseOrderItems: newData.selectPO.PurchaseOrderItems ?? newData.selectPO.items ?? [],
                        items: newData.selectPO.items ?? newData.selectPO.PurchaseOrderItems ?? []
                    };
                } else {
                    selectPO.value = null;
                }

                verifyItem.value = newData.verifyItem ?? [];
            },
            { immediate: true, deep: true }
        );

        const goBack = () => {
            router.push('/deliveries');
        };

        // ---------------------------
        // 5. RETURN
        // ---------------------------
        return {
            deliveryInfo,
            selectPO,
            verifyItem,
            deliveryListColumn,
            deliveredItems,
            hasDeliveredItems,
            onFormSubmit,
            goBack,
            toastRef,
            formatDate
        };
    }
});
