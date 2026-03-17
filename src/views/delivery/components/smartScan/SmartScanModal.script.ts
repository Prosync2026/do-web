import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { defineComponent, ref, watch } from 'vue';
import OcrResultTable from './OcrResultTable.vue';
import type { OcrLineItem } from './OcrResultTable.script';

export interface OcrResult {
    soNo: string;
    doNo: string;
    supplierName: string;
    deliveryDate: string;
    items: OcrLineItem[];
    /** The original file that was uploaded */
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
        // ─── State ──────────────────────────────────────────────────────────────
        const visible = ref(props.modelValue);
        const phase = ref<Phase>('upload');
        const isDragging = ref(false);
        const selectedFile = ref<File | null>(null);
        const isScanning = ref(false);
        const errorMessage = ref('');
        const scanningMessage = ref('Analysing layout…');
        const fileInput = ref<HTMLInputElement | null>(null);

        const ocrResult = ref<OcrResult>({
            soNo: '',
            doNo: '',
            supplierName: '',
            deliveryDate: '',
            items: []
        });

        watch(
            () => props.modelValue,
            (v) => {
                visible.value = v;
                if (v) {
                    phase.value = 'upload';
                    selectedFile.value = null;
                    ocrResult.value = { soNo: '', doNo: '', supplierName: '', deliveryDate: '', items: [] };
                }
            }
        );

        watch(visible, (v) => emit('update:modelValue', v));

        // ─── File handling ───────────────────────────────────────────────────
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

        // ─── Scanning (mock OCR) ──────────────────────────────────────────────
        async function startScan() {
            if (!selectedFile.value) return;

            phase.value = 'scanning';
            isScanning.value = true;

            let msgIdx = 0;
            const msgInterval = setInterval(() => {
                msgIdx = (msgIdx + 1) % SCANNING_MESSAGES.length;
                scanningMessage.value = SCANNING_MESSAGES[msgIdx]!;
            }, 900);

            try {
                // ── PHASE 1: MOCK RESPONSE ──────────────────────────────────────
                // Replace this block with real API call in Phase 2:
                // const result = await doOcrService.scan(selectedFile.value);
                await new Promise((r) => setTimeout(r, 3500));

                const mockResult: OcrResult = {
                    soNo: 'SO-1772162123648',
                    doNo: 'DO-2026-00342',
                    supplierName: 'Syarikat Bahan Binaan Sdn Bhd',
                    deliveryDate: '2026-03-17',
                    sourceFile: selectedFile.value,
                    items: [
                        {
                            itemCode: 'MAT-001',
                            description: 'Steel Bar 12mm x 6m',
                            qty: 50,
                            uom: 'PCS',
                            remarks: '',
                            confidence: { itemCode: 0.95, description: 0.92, qty: 0.88, uom: 0.97 }
                        },
                        {
                            itemCode: 'MAT-007',
                            description: 'Concrete Mix Grade 30',
                            qty: 12,
                            uom: 'M3',
                            remarks: '',
                            confidence: { itemCode: 0.91, description: 0.89, qty: 0.6, uom: 0.95 }
                        },
                        {
                            itemCode: 'MAT-023',
                            description: "Plywood 18mm (4'x8')",
                            qty: 30,
                            uom: 'SHT',
                            remarks: 'Handle with care',
                            confidence: { itemCode: 0.55, description: 0.7, qty: 0.93, uom: 0.9 }
                        }
                    ]
                };

                ocrResult.value = mockResult;
                phase.value = 'result';
            } catch (err: any) {
                errorMessage.value = err?.message || 'An unexpected error occurred. Please try again or enter manually.';
                phase.value = 'error';
            } finally {
                clearInterval(msgInterval);
                isScanning.value = false;
            }
        }

        // ─── Actions ──────────────────────────────────────────────────────────
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
