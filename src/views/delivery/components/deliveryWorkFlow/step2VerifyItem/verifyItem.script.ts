import type { VerifyPurchaseOrderItem } from '@/types/delivery.type';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types/purchase.type';
import { useToast } from '@/utils/toastBus';
import { PhPackage, PhSealCheck, PhWarning } from '@phosphor-icons/vue';
import Form, { FormSubmitEvent } from '@primevue/forms/form';
import { ProBanner, ProButton, ProCard, ProDatePicker, ProInput, ProSelect, ProTag, ProTextarea } from '@prosync_solutions/ui';
import Calendar from 'primevue/calendar';
import FileUpload from 'primevue/fileupload';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { computed, defineComponent, reactive, ref, watch } from 'vue';

export default defineComponent({
    name: 'VerifyItem',
    components: { Message, Toast, Form, Calendar, Textarea, FileUpload, ProgressBar, ProCard, ProButton, ProTag, ProInput, ProDatePicker, ProTextarea, ProSelect, ProBanner, PhWarning, PhSealCheck, PhPackage },
    emits: ['update', 'next-step', 'prev-step'],
    props: {
        selectedPo: {
            type: Object as () => PurchaseOrder | null,
            required: true
        },
        prefillPlate: {
            type: String,
            default: ''
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

        const initialValues = reactive({
            driverPlate: '',
            deliveryDate: new Date() as Date | null,
            doNumber: '',
            remarks: ''
        });
        const errors = reactive<{ driverPlate?: string; deliveryDate?: string }>({});

        const formatDateToAPI = (date: Date | string | null) => {
            if (!date) return '';
            const d = new Date(date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const isPoSelected = computed(() => {
            return poNumber.value !== null && poNumber.value !== '';
        });

        // ---------------------------
        // 2. WATCHERS
        // ---------------------------
        watch(
            () => props.prefillPlate,
            (newPlate) => {
                if (newPlate) {
                    initialValues.driverPlate = newPlate;
                }
            },
            { immediate: true }
        );

        watch(
            () => props.selectedPo,
            (newPo) => {
                // Treat null or empty object as no PO selected
                if (!newPo || Object.keys(newPo).length === 0) {
                    itemList.value = [];
                    poNumber.value = null;
                    return;
                }

                const items = (newPo as any).purchase_order_items
                    ?? (newPo as any).items
                    ?? (newPo as any).PurchaseOrderItems
                    ?? [];

                if (!items || items.length === 0) {
                    itemList.value = [];
                    poNumber.value = null;
                    return;
                }

                itemList.value = items.map((i: PurchaseOrderItem) => {
                    const totalQty = Number(i.qty ?? (i as any).Quantity) || 0;
                    return {
                        id: i.id ?? (i as any).Id,
                        purchaseOrderId: (newPo as any).id ?? (newPo as any).Id,
                        requestOrderId: i.requestOrderId ?? 0,
                        name: i.description ?? (i as any).Name ?? 'Unnamed Item',
                        order: i.code ?? (i as any).ItemCode ?? '',
                        status: 'Pending',
                    location: '',
                        category: '',
                        type: '',
                        splits: [{ _id: Math.random().toString(36).substr(2, 9), delivered: totalQty, received: totalQty, location: '', remarks: '' }],
                        total: totalQty,
                        uom: (i as any).uom ?? (i as any).Uom ?? '-',
                        price: Number((i as any).price ?? (i as any).Price) || 0,
                        roDocNo: (i as any).roDocNo ?? (i as any).RoDocNo ?? '-'
                    };
                });

                poNumber.value = (newPo as any).poNumber ?? (newPo as any).DocNo ?? null;
            },
            { immediate: true, deep: true }
        );

        // ---------------------------
        // 3. METHODS
        // ---------------------------
        const onFormSubmit = (event: FormSubmitEvent) => {
            errors.driverPlate = '';

            if (!initialValues.driverPlate?.trim()) {
                errors.driverPlate = 'Driver Plate Number is required.';
                toast.add({
                    severity: 'warn',
                    summary: 'Driver Plate Number Missing',
                    detail: errors.driverPlate,
                    life: 2500
                });
                return;
            }

            if (event.valid) {
                const minimalItems = itemList.value.map((i) => ({
                    purchaseOrderItemId: i.id,
                    requestOrderId: i.requestOrderId,
                    splits: i.splits
                }));

                const payload = {
                    items: minimalItems,
                    doNumber: initialValues.doNumber,
                    deliveryDate: initialValues.deliveryDate,
                    driverPlate: initialValues.driverPlate,
                    remarks: initialValues.remarks
                };

                emit('update', payload);
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

        const addSplit = (index: number) => {
            if (itemList.value[index]) {
                const totalQty = itemList.value[index].total;
                itemList.value[index].splits.push({ _id: Math.random().toString(36).substr(2, 9), delivered: totalQty, received: totalQty, location: '', remarks: '' });
            }
        };

        const removeSplit = (itemIndex: number, splitIndex: number) => {
            if (itemList.value[itemIndex] && itemList.value[itemIndex].splits.length > 1) {
                itemList.value[itemIndex].splits.splice(splitIndex, 1);
            }
        };

        const locationOptions = [
            { label: 'Site A', value: 'Site A' },
            { label: 'Site B', value: 'Site B' },
            { label: 'Warehouse', value: 'Warehouse' },
            { label: 'HQ', value: 'HQ' }
        ];

        // ---------------------------
        // 4. RETURN
        // ---------------------------
        return {
            itemList,
            poNumber,
            expanded,
            activeIndex,
            toastRef,
            initialValues,
            errors,
            formatDateToAPI,
            onFormSubmit,
            goBack,
            toggle,
            addSplit,
            removeSplit,
            locationOptions,
            isPoSelected
        };
    }
});
