import { computed, defineComponent, PropType } from 'vue';
import { ProButton, ProInput } from '@prosync_solutions/ui';

export interface OcrLineItem {
    itemCode: string;
    description: string;
    qty: number | null;
    uom: string;
    remarks?: string;
    confidence?: {
        itemCode?: number;
        description?: number;
        qty?: number;
        uom?: number;
    };
}

//  Confidence threshold below which a field is flagged 
const LOW_CONFIDENCE = 0.75;

export default defineComponent({
    name: 'OcrResultTable',
    components: { ProButton, ProInput },
    props: {
        items: {
            type: Array as PropType<OcrLineItem[]>,
            required: true
        }
    },
    emits: ['update:items'],
    setup(props, { emit }) {
        function isLow(val?: number): boolean {
            return val !== undefined && val < LOW_CONFIDENCE;
        }

        function hasLowConfidence(item: OcrLineItem): boolean {
            if (!item.confidence) return false;
            return Object.values(item.confidence).some((v) => v !== undefined && v < LOW_CONFIDENCE);
        }

        const hasAnyLowConfidence = computed(() => props.items.some(hasLowConfidence));

        function removeRow(idx: number) {
            const updated = [...props.items];
            updated.splice(idx, 1);
            emit('update:items', updated);
        }

        function addRow() {
            emit('update:items', [...props.items, { itemCode: '', description: '', qty: null, uom: '', remarks: '' }]);
        }

        return {
            isLow,
            hasLowConfidence,
            hasAnyLowConfidence,
            removeRow,
            addRow
        };
    }
});
