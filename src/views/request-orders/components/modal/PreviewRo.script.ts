import { PhPaperclip } from '@phosphor-icons/vue';
import { PreviewSummary } from '@/types/request-order.type';
import { formatDateToAPI } from '@/utils/dateHelper';
import { ProButton, ProModal, ProTable, ProTag } from '@prosync_solutions/ui';
import { defineComponent, PropType, ref, watch } from 'vue';

export default defineComponent({
    name: 'PreviewRo',
    components: { ProModal, ProButton, ProTable, ProTag, PhPaperclip },
    props: {
        visible: {
            type: Boolean,
            required: true
        },
        summaryData: {
            type: Object as PropType<PreviewSummary>,
            required: true
        }
    },
    emits: ['update:visible', 'submit'],
    setup(props, { emit }) {
        const localVisible = ref(props.visible);

        // Sync prop changes from parent, for modal visibility
        watch(
            () => props.visible,
            (newVal) => {
                localVisible.value = newVal;
            }
        );

        // Emit changes to parent
        watch(localVisible, (val) => {
            emit('update:visible', val);
        });

        function handleClose(): void {
            localVisible.value = false;
        }

        const isSubmitting = ref(false);

        function handleSubmit(): void {
            isSubmitting.value = true;
            emit('submit');
            setTimeout(() => {
                isSubmitting.value = false;
                emit('update:visible', false);
            }, 500);
        }

        function formatCurrency(amount: number): string {
            return amount.toLocaleString('en-MY', {
                style: 'currency',
                currency: 'MYR'
            });
        }

        function formatDate(date: Date | null | string): string {
            if (!date) return '-';

            const dateObj = typeof date === 'string' ? new Date(date) : date;

            if (isNaN(dateObj.getTime())) return '-';

            return dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        function isOverdue(date: Date | null | string): boolean {
            if (!date) return false;

            const dateObj = typeof date === 'string' ? new Date(date) : date;

            if (isNaN(dateObj.getTime())) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dateObj.setHours(0, 0, 0, 0);

            return dateObj < today;
        }

        const columns = [
            { key: 'no', label: 'No', width: '50px' },
            { key: 'itemType', label: 'Item Type', width: '100px' },
            { key: 'itemCode', label: 'Item Code', width: '120px' },
            { key: 'description', label: 'Description', width: '250px' },
            { key: 'location', label: 'Location', width: '150px' },
            { key: 'uom', label: 'UOM', width: '80px', align: 'center' },
            { key: 'qty', label: 'QTY', width: '80px', align: 'center' },
            { key: 'qtyRequested', label: 'ReqQty', width: '80px', align: 'center' },
            { key: 'budgetQty', label: 'BgtQty', width: '80px', align: 'center' },
            { key: 'qtyOrdered', label: 'QtyOrd', width: '80px', align: 'center' },
            { key: 'qtyDelivered', label: 'QtyDelivered', width: '100px', align: 'center' },
            { key: 'deliveryDate', label: 'Del. Date', width: '120px', align: 'center' }
        ];

        return {
            isSubmitting,
            handleClose,
            handleSubmit,
            formatCurrency,
            formatDate,
            columns,
            isOverdue,
            localVisible,
            formatDateToAPI
        };
    }
});
