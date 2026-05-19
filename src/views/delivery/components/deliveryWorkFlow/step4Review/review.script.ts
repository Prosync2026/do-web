import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import type { DeliveryFlow } from '@/types/delivery.type';
import type { TableColumn } from '@/types/table.type';
import Toast from 'primevue/toast';
import { useToast } from '@/utils/toastBus';
import { computed, defineComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ProCard, ProButton, ProTag, ProTable, ProBanner } from '@prosync_solutions/ui';
import { PhArrowsLeftRight, PhReceipt, PhTruck, PhPackage, PhInfo, PhFileText, PhCamera } from '@phosphor-icons/vue';

export default defineComponent({
    name: 'Review',
    components: { Toast, ProCard, ProButton, ProTag, ProTable, ProBanner, PhArrowsLeftRight, PhReceipt, PhTruck, PhPackage, PhInfo, PhFileText, PhCamera },
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
        const verifyItem = ref<DeliveryFlow['verifyItem'] | null>(props.deliveryData.verifyItem ?? null);

        const toast = useToast();
        const router = useRouter();
        const deliveryStore = useDeliveryStore();

        const toastRef = ref<InstanceType<typeof Toast> | null>(null);

        const deliveryListColumn: any[] = [
            { key: 'ItemCode', label: 'Item Code', sortable: true },
            { key: 'SoDocNo', label: 'DO No.', sortable: true },
            { key: 'Name', label: 'Item Name', sortable: true },
            { key: 'Price', label: 'Unit Price' },
            { key: 'Quantity', label: 'Quantity' }
        ];

        // ---------------------------
        // 2. COMPUTED
        // ---------------------------

        // for ReusableTable
        const deliveredItems = computed(() => {
            const po = selectPO.value;
            if (!po || !po.PurchaseOrderItems) return [];

            return po.PurchaseOrderItems.map((item: any) => {
                const matchedVerifyItem = verifyItem.value?.items?.find((v: any) => v.purchaseOrderItemId === (item.Id ?? item.id));
                const totalDelivered = matchedVerifyItem?.splits?.reduce((sum: number, split: any) => sum + (Number(split.delivered) || 0), 0) || 0;
                const totalReceived = matchedVerifyItem?.splits?.reduce((sum: number, split: any) => sum + (Number(split.received) || 0), 0) || 0;
                
                return {
                    ItemCode: item.ItemCode ?? item.code ?? item.itemCode,
                    Name: item.Name ?? item.description ?? item.name,
                    Price: item.Price ?? item.price,
                    Quantity: totalDelivered,
                    Received: totalReceived,
                    Uom: item.Uom ?? item.uom,
                    SoDocNo: item.SoDocNo ?? po.DocNo
                };
            });
        });

        const hasDeliveredItems = computed(() => deliveredItems.value.length > 0);

        const formatDate = (dateStr?: string) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toISOString().split('T')[0];
        };

        // ---------------------------
        // 3. SUBMIT FUNCTION
        // ---------------------------

        const onFormSubmit = async () => {

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
                DocNo: verifyItem.value?.doNumber || selectPO.value.poNumber || selectPO.value.DocNo,
                Date: verifyItem.value?.deliveryDate,
                DeliveryDate: verifyItem.value?.deliveryDate,
                TotalAmount: null,
                GstAmount: null,
                Terms: null,
                RefDoc: selectPO.value.poNumber || selectPO.value.DocNo,
                Posting: null,
                Currency: null,
                Gst: null,
                PlateNo: verifyItem.value?.driverPlate,
                Remark: verifyItem.value?.remarks,
                Attachment: null,
                Status: 'Processing',
                CreatedAt: new Date().toISOString(),
                CreatedBy: 'James',
                ProjectId: 1,
                ProjectName: 'Site A',
                supplier: { CompanyName: (selectPO.value as any).supplier?.CompanyName ?? 'Unknown Supplier' },
                purchase_order: {
                    DocNo: selectPO.value.DocNo ?? selectPO.value.poNumber,
                    supplier: { CompanyName: (selectPO.value as any).supplier?.CompanyName ?? 'Unknown Supplier' }
                },
                DeliveryOrderItems: (verifyItem.value?.items || []).flatMap((item: any) => 
                    (item.splits || []).map((split: any) => ({
                        PurchaseOrderItemId: item.purchaseOrderItemId,
                        RequestOrderItemId: item.requestOrderId,
                        Quantity: split.delivered,
                        Delivered: split.delivered,
                        Received: split.received,
                        Location: split.location,
                        Remarks: split.remarks
                    }))
                ),
                Items: JSON.stringify(
                    (verifyItem.value?.items || []).flatMap((item: any) => 
                        (item.splits || []).map((split: any) => ({
                            PurchaseOrderItemId: item.purchaseOrderItemId,
                            RequestOrderItemId: item.requestOrderId,
                            Quantity: split.delivered,
                            Delivered: split.delivered,
                            Received: split.received,
                            Location: split.location,
                            Remarks: split.remarks
                        }))
                    )
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

                verifyItem.value = newData.verifyItem ?? null;
            },
            { immediate: true, deep: true }
        );

        const saveAsDraft = () => {
            toast.add({
                severity: 'info',
                summary: 'Draft Saved',
                detail: 'This functionality is mocked as the backend endpoint is not yet available.',
                life: 3000
            });
            emit('update', { status: 'Draft' });
        };

        const goBack = () => {
            emit('prev-step');
        };

        const cancel = () => {
            router.push('/deliveries');
        };

        // ---------------------------
        // 5. RETURN
        // ---------------------------
        return {
            deliveryInfo,
            selectPO,
            verifyItem,
            toastRef,
            deliveredItems,
            hasDeliveredItems,
            deliveryListColumn,
            formatDate,
            onFormSubmit,
            saveAsDraft,
            cancel,
            goBack
        };
    }
});
