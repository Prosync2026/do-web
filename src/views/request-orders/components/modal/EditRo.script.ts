import { requestOrderService } from '@/services/requestOrder.service';
import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import type { AttachmentItem, CreateRequestOrderPayload, EditForm, Order } from '@/types/request-order.type';
import { formatDateToAPI, parseDDMMYYYY } from '@/utils/dateHelper';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Column from 'primevue/column';
import { usePrimeVue } from 'primevue/config';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Menu from 'primevue/menu';
import ProgressBar from 'primevue/progressbar';
import { useToast } from 'primevue/usetoast';
import { defineComponent, PropType, ref, watch } from 'vue';

export default defineComponent({
    name: 'EditRo',
    components: { Dialog, Button, InputText, InputNumber, DataTable, Column, FileUpload, ProgressBar, Menu },
    props: {
        visible: { type: Boolean, required: true },
        order: { type: Object as PropType<Order | null>, default: null }
    },
    emits: ['update:visible', 'save'],
    setup(props, { emit }) {
        const { updateOrder } = useRequestOrderStore();
        const { loading } = storeToRefs(useRequestOrderStore());
        const localVisible = ref(props.visible);
        const toast = useToast();

        // File upload states
        const totalSize = ref(0);
        const totalSizePercent = ref(0);
        const files = ref<File[]>([]);
        const overallRemark = ref('');
        const MAX_FILE_SIZE = 1_000_000;
        const attachments = ref<(File | AttachmentItem)[]>([]);
        const isAttachmentValid = ref(true);
        const $primevue = usePrimeVue();
        const newAttachments = ref<File[]>([]);
        const existingAttachments = ref<AttachmentItem[]>([]);

        const filesToUpload = ref<File[]>([]);

        function onSelectedFiles(event: any) {
            newAttachments.value = event.files;
        }

        watch(
            () => props.visible,
            (val) => (localVisible.value = val)
        );
        watch(localVisible, (val) => emit('update:visible', val));

        const budgetTypeOptions = [
            { label: 'Budgeted', value: 'Budgeted' },
            { label: 'NonBudgeted', value: 'NonBudgeted' }
        ];

        const defaultForm = (): EditForm => ({
            roNumber: '',
            requestedBy: '',
            roDate: null,
            deliveryDate: null,
            totalAmount: 0,
            budgetType: 'Budgeted',
            remark: '',
            terms: 'Net 30',
            refDoc: 'RQ-001',
            currency: 'MYR',
            items: [],
            attachments: []
        });

        const editForm = ref<EditForm>(defaultForm());

        function parseDate(value: string | Date | null | undefined): Date | null {
            if (!value) return null;
            if (value instanceof Date) return value;
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }

        watch(
            () => props.order,
            (newOrder) => {
                if (!newOrder) return;
                const sourceItems = newOrder.RequestOrderItems?.length ? newOrder.RequestOrderItems : newOrder.items || [];
                attachments.value = newOrder.attachments || [];

                editForm.value = {
                    roNumber: newOrder.roNumber,
                    requestedBy: newOrder.requestedBy,
                    roDate: parseDDMMYYYY(newOrder.roDate),
                    deliveryDate: parseDDMMYYYY(newOrder.deliveryDate),

                    totalAmount: Number(newOrder.totalAmount),
                    budgetType: newOrder.budgetType === 'Budgeted' ? 'Budgeted' : 'NonBudgeted',
                    remark: newOrder.remark || '',
                    terms: newOrder.terms || 'Net 30',
                    refDoc: newOrder.refDoc || 'RQ-001',
                    currency: newOrder.currency || 'MYR',
                    attachments: (newOrder.attachments || []) as Array<File | AttachmentItem>,
                    items: sourceItems.map((item: any) => ({
                        code: item.ItemCode || item.code || '',
                        description: item.Description || item.description || '',
                        uom: item.Unit || item.uom || '',
                        qty: Number(item.Quantity ?? item.qty ?? 0),
                        deliveryDate: parseDDMMYYYY(item.DeliveryDate ?? item.deliveryDate),
                        notes: item.Notes ?? item.notes ?? item.note ?? '',
                        remark: item.Remark ?? item.remark ?? '',
                        budgetItemId: item.BudgetItemId ?? item.budgetItemId ?? null,
                        nonBudgetItemId: item.NonBudgetItemId ?? item.nonBudgetItemId ?? null
                    }))
                };
            },
            { immediate: true }
        );
        watch(editForm, (form) => {
            existingAttachments.value = form.attachments.filter((f) => !(f instanceof File)) as AttachmentItem[];
        });
        async function handleSave(): Promise<void> {
            if (!props.order) return;

            // const filesToUpload: File[] = Array.isArray(newAttachments.value) ? [...newAttachments.value] : [];

            const payload: CreateRequestOrderPayload = {
                DocNo: editForm.value.roNumber || '',
                DebtorId: props.order.debtorId || 1,
                TotalAmount: editForm.value.totalAmount || 0,
                CreatedBy: editForm.value.requestedBy || 'Unknown',
                RequestOrderDate: formatDateToAPI(editForm.value.roDate),
                Terms: editForm.value.terms || 'Net 30',
                RefDoc: editForm.value.refDoc || '',
                Status: props.order.status as 'Approved' | 'Rejected' | 'Processing' | 'Submitted',
                BudgetType: editForm.value.budgetType === 'Budgeted' ? 'Budgeted' : 'NonBudgeted',
                Currency: 'MYR',
                Type: 'requestOrder',
                Remark: editForm.value.remark || '',
                Items: (editForm.value.items || []).map((item) => ({
                    BudgetItemId: item.budgetItemId ?? null,
                    NonBudgetItemId: item.nonBudgetItemId ?? null,
                    Description: item.description || '',
                    Uom: item.uom || '',
                    Quantity: Number(item.qty ?? 0),
                    OrgBgtQty: 0,
                    BgtBalQty: 0,
                    TotalPOQty: 0,
                    ItemCode: item.code || '',
                    ItemType: 'default',
                    Rate: item.rate ?? 0,
                    Notes: item.notes || '',
                    Reason: item.reason || '',
                    DeliveryDate: formatDateToAPI(item.deliveryDate)
                }))
            };

            try {
                const result = await requestOrderService.updateRequestOrder(props.order.id.toString(), payload, newAttachments.value);

                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Request order updated successfully.',
                        life: 3000
                    });
                    emit('save');
                    localVisible.value = false;
                    newAttachments.value = [];
                } else {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: result.message || 'Failed to update request order.',
                        life: 3000
                    });
                }
            } catch (error: any) {
                console.error('Update failed:', error.response?.data || error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.response?.data?.message || 'Failed to update request order.',
                    life: 3000
                });
            }
        }

        function handleCancel(): void {
            if (props.order) {
                editForm.value = {
                    ...defaultForm(),
                    roNumber: props.order.roNumber || '',
                    requestedBy: props.order.requestedBy || '',
                    roDate: parseDate(props.order.roDate),
                    deliveryDate: parseDate(props.order.deliveryDate),
                    totalAmount: Number(props.order.totalAmount || 0),
                    budgetType: props.order.budgetType || 'Budgeted',
                    remark: props.order.remark || '',
                    terms: props.order.terms || 'Net 30',
                    refDoc: props.order.refDoc || 'RQ-001',
                    currency: props.order.currency || 'MYR',
                    items: (props.order.items || []).map((item) => ({
                        budgetItemId: item.budgetItemId ?? null,
                        nonBudgetItemId: item.nonBudgetItemId ?? null,
                        code: item.code || '',
                        description: item.description || '',
                        uom: item.uom || '',
                        qty: Number(item.qty || 0),
                        deliveryDate: parseDate(item.deliveryDate),
                        notes: item.notes || '',
                        remark: item.remark || ''
                    })),
                    attachments: props.order.attachments || []
                };
            } else {
                editForm.value = defaultForm();
            }
            localVisible.value = false;
        }

        function addItem(): void {
            editForm.value.items.push({
                budgetItemId: null,
                nonBudgetItemId: null,
                description: '',
                uom: '',
                qty: 0,
                deliveryDate: null,
                notes: '',
                remark: ''
            });
        }

        function removeItem(index: number): void {
            editForm.value.items.splice(index, 1);
        }

        function getAttachmentName(file: File | AttachmentItem): string {
            return file instanceof File ? file.name : file.filename;
        }

        function previewAttachment(file: File | AttachmentItem) {
            if (!(file instanceof File)) {
                requestOrderService.previewAttachment(file);
            }
        }

        function downloadAttachment(file: File | AttachmentItem) {
            if (!(file instanceof File)) {
                requestOrderService.downloadAttachment(file);
            }
        }

        const onRemoveTemplatingFile = (file: File, removeFileCallback: (index: number) => void, index: number) => {
            removeFileCallback(index);
            totalSize.value -= file.size;
            totalSizePercent.value = Math.min((totalSize.value / 1000000) * 100, 100);
        };

        const onClearTemplatingUpload = (clear: () => void) => {
            clear();
            totalSize.value = 0;
            totalSizePercent.value = 0;
        };

        const uploadEvent = (callback: () => void) => {
            totalSizePercent.value = Math.min((totalSize.value / 1000000) * 100, 100);
            callback();
        };

        const onTemplatedUpload = () => {
            toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
        };

        function formatSize(bytes: number) {
            const k = 1024;
            const dm = 2;
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
        }

        function removeNewAttachment(index: number) {
            newAttachments.value.splice(index, 1);
        }

        function removeExistingAttachment(index: number) {
            existingAttachments.value.splice(index, 1);
        }

        return {
            localVisible,
            editForm,
            budgetTypeOptions,
            handleSave,
            handleCancel,
            addItem,
            removeItem,
            useRequestOrderStore,
            loading,
            previewAttachment,
            getAttachmentName,
            onRemoveTemplatingFile,
            onClearTemplatingUpload,
            uploadEvent,
            onTemplatedUpload,
            formatSize,
            totalSize,
            totalSizePercent,
            files,
            overallRemark,
            MAX_FILE_SIZE,
            attachments,
            isAttachmentValid,
            usePrimeVue,
            newAttachments,
            existingAttachments,
            removeNewAttachment,
            removeExistingAttachment,
            onSelectedFiles,
            filesToUpload,
            downloadAttachment
        };
    }
});
