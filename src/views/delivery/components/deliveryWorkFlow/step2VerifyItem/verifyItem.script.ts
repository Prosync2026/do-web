import type { VerifyPurchaseOrderItem } from '@/types/delivery.type';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types/purchase.type';
import Form, { FormSubmitEvent } from '@primevue/forms/form';
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

export default defineComponent({
    name: 'VerifyItem',
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
        Badge
    },
    emits: ['update', 'next-step', 'prev-step'],
    props: {
        selectedPo: {
            type: Object as () => PurchaseOrder | null,
            required: true
        }
    },
    setup(props, { emit }) {
        // ---------------------------
        // 1. STATE
        // ---------------------------
        const itemList = ref<VerifyPurchaseOrderItem[]>([]);
        const poNumber = ref<string | null>(null);
        const expanded = ref<number[]>([]);
        const activeIndex = ref<number[]>([0]);
        const toast = useToast();
        const toastRef = ref<InstanceType<typeof Toast> | null>(null);

        const isPoSelected = computed(() => {
            return poNumber.value !== null && poNumber.value !== '';
        });

        // ---------------------------
        // 2. WATCHERS
        // ---------------------------
        watch(
            () => props.selectedPo,
            (newPo) => {
                if (!newPo) {
                    itemList.value = [];
                    poNumber.value = null;
                    return;
                }

                const items = newPo.purchase_order_items ?? newPo.items ?? newPo.PurchaseOrderItems ?? [];

                if (!items || items.length === 0) {
                    itemList.value = [];
                    poNumber.value = null;
                    return;
                }

                itemList.value = items.map((i: PurchaseOrderItem) => {
                    const item = {
                        id: i.id ?? i.Id,
                        purchaseOrderId: newPo.id ?? newPo.Id,
                        requestOrderId: i.requestOrderId ?? 0,
                        name: i.description ?? i.Name ?? 'Unnamed Item',
                        order: i.code ?? i.ItemCode ?? '',
                        status: 'Pending',
                        location: '',
                        category: '',
                        type: '',
                        delivered: 0,
                        total: Number(i.qty ?? i.Quantity) || 0
                    };
                    return item;
                });

                poNumber.value = newPo.poNumber ?? newPo.DocNo ?? null;
            },
            { immediate: true, deep: true }
        );

        // ---------------------------
        // 3. METHODS
        // ---------------------------
        const onFormSubmit = (event: FormSubmitEvent) => {
            if (event.valid) {
                const minimalItems = itemList.value.map((i) => ({
                    purchaseOrderItemId: i.id,
                    requestOrderId: i.requestOrderId,
                    delivered: i.delivered
                }));

                emit('update', minimalItems);
                emit('next-step');

                toast.add({
                    severity: 'success',
                    summary: 'Form submitted',
                    detail: `PO ${poNumber.value} with ${minimalItems.length} items submitted.`,
                    life: 3000
                });
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Form Invalid',
                    detail: 'Please fix the errors in the form before submitting.',
                    life: 3000
                });
            }
        };

        const goBack = () => {
            emit('prev-step');
        };

        const toggle = (id: number) => {
            expanded.value = expanded.value.includes(id) ? expanded.value.filter((x) => x !== id) : [...expanded.value, id];
        };

        // ---------------------------
        // 4. RETURN
        // ---------------------------
        return {
            itemList,
            poNumber,
            expanded,
            activeIndex,
            toastRef,
            onFormSubmit,
            goBack,
            toggle,
            isPoSelected
        };
    }
});
