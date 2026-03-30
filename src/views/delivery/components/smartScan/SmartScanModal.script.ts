import { extractDeliveryOrder } from '@/services/smartScan.service';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { defineComponent, onUnmounted, ref, watch } from 'vue';
import type { OcrLineItem } from './OcrResultTable.script';
import OcrResultTable from './OcrResultTable.vue';

export interface OcrResult {
    soNo: string;
    doNo: string;
    supplierName: string;
    deliveryDate: string;
    plateNo: string;
    items: OcrLineItem[];
    // The original file that was uploaded 
    sourceFile?: File;
}

type Phase = 'upload' | 'scanning' | 'result' | 'error';

const SCANNING_MESSAGES = ['Analysing layout…', 'Detecting text regions…', 'Extracting line items…', 'Parsing quantities and UOM…', 'Finalising results…'];

export default defineComponent({
    name: 'SmartScanModal',
    components: { Dialog, Button, Message, InputText, ProgressSpinner, OcrResultTable },
    props: {
        modelValue: {
            type: Boolean,
            required: true
        }
    },
    emits: ['update:modelValue', 'confirm', 'manual'],
    setup(props, { emit }) {
        //State
        const visible = ref(props.modelValue);
        const phase = ref<Phase>('upload');
        const isDragging = ref(false);
        const selectedFile = ref<File | null>(null);
        const isScanning = ref(false);
        const errorMessage = ref('');
        const scanningMessage = ref('Analysing layout…');
        const fileInput = ref<HTMLInputElement | null>(null);
        const filePreviewUrl = ref<string | null>(null);

        const ocrResult = ref<OcrResult>({
            soNo: '',
            doNo: '',
            supplierName: '',
            deliveryDate: '',
            plateNo: '',
            items: []
        });

        function revokePreviewUrl() {
            if (filePreviewUrl.value) {
                URL.revokeObjectURL(filePreviewUrl.value);
                filePreviewUrl.value = null;
            }
        }

        watch(
            () => props.modelValue,
            (v) => {
                visible.value = v;
                if (v) {
                    phase.value = 'upload';
                    selectedFile.value = null;
                    revokePreviewUrl();
                    ocrResult.value = { soNo: '', doNo: '', supplierName: '', deliveryDate: '', plateNo: '', items: [] };
                }
            }
        );

        watch(selectedFile, (file) => {
            revokePreviewUrl();
            if (file) filePreviewUrl.value = URL.createObjectURL(file);
        });

        onUnmounted(revokePreviewUrl);

        watch(visible, (v) => emit('update:modelValue', v));

        // File handling
        function triggerFileInput() {
            fileInput.value?.click();
        }

        function onFileInputChange(e: Event) {
            const target = e.target as HTMLInputElement;
            if (target.files?.[0]) setFile(target.files[0]);
        }

        function onDrop(e: DragEvent) {
            isDragging.value = false;
            const file = e.dataTransfer?.files?.[0];
            if (file) setFile(file);
        }

        function setFile(file: File) {
            const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowed.includes(file.type)) {
                errorMessage.value = 'Unsupported file type. Please upload a JPG, PNG or PDF.';
                phase.value = 'error';
                return;
            }
            if (file.size > 10_000_000) {
                errorMessage.value = 'File is too large. Maximum size is 10 MB.';
                phase.value = 'error';
                return;
            }
            selectedFile.value = file;
        }

        function clearFile() {
            selectedFile.value = null;
            if (fileInput.value) fileInput.value.value = '';
        }

        function formatSize(bytes: number): string {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }

        // Scanning
        async function startScan() {
            if (!selectedFile.value) return;

            if (selectedFile.value.type !== 'application/pdf') {
                errorMessage.value = 'Only PDF files are supported for Smart Scan.';
                phase.value = 'error';
                return;
            }

            phase.value = 'scanning';
            isScanning.value = true;

            let msgIdx = 0;
            const msgInterval = setInterval(() => {
                msgIdx = (msgIdx + 1) % SCANNING_MESSAGES.length;
                scanningMessage.value = SCANNING_MESSAGES[msgIdx]!;
            }, 900);

            try {
                const result = await extractDeliveryOrder(selectedFile.value);

                ocrResult.value = {
                    soNo: result.soNo,
                    doNo: result.doNo,
                    supplierName: result.supplierName,
                    deliveryDate: result.deliveryDate,
                    plateNo: result.plateNo,
                    sourceFile: selectedFile.value,
                    items: result.items.map((i) => ({
                        itemCode: i.itemCode,
                        description: i.description,
                        qty: i.qty,
                        uom: i.uom,
                        remarks: i.remarks,
                        confidence: { itemCode: 1, description: 1, qty: 1, uom: 1 }
                    }))
                };

                phase.value = 'result';
            } catch (err: any) {
                errorMessage.value = err?.message || 'An unexpected error occurred. Please try again or enter manually.';
                phase.value = 'error';
            } finally {
                clearInterval(msgInterval);
                isScanning.value = false;
            }
        }

        // Actions 
        function onConfirm() {
            emit('confirm', { ...ocrResult.value });
            visible.value = false;
        }

        function onManualFallback() {
            emit('manual');
            visible.value = false;
        }

        function onClose() {
            if (isScanning.value) return;
            visible.value = false;
        }

        return {
            visible,
            phase,
            isDragging,
            selectedFile,
            isScanning,
            errorMessage,
            scanningMessage,
            fileInput,
            ocrResult,
            filePreviewUrl,
            triggerFileInput,
            onFileInputChange,
            onDrop,
            clearFile,
            formatSize,
            startScan,
            onConfirm,
            onManualFallback,
            onClose
        };
    }
});
