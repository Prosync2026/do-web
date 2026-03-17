import { usePurchaseOrderStore } from '@/stores/purchase-order/purchaseOrder.store';
import type { OcrResult } from '@/views/delivery/components/smartScan/SmartScanModal.script';
import SelectPO from '@/views/delivery/components/deliveryWorkFlow/step1SelectPO/selectPO.vue';
import VerifyItem from '@/views/delivery/components/deliveryWorkFlow/step2VerifyItem/verifyItem.vue';
import DeliveryInfo from '@/views/delivery/components/deliveryWorkFlow/step3DeliveryInfo/deliveryInfo.vue';
import Review from '@/views/delivery/components/deliveryWorkFlow/step4Review/review.vue';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, ref } from 'vue';

export default defineComponent({
    components: { DeliveryInfo, SelectPO, VerifyItem, Review },
    setup() {
        // ---------------------------
        // 1. DATA (constants, refs)
        // ---------------------------
        const activeStep = ref(1);
        const toast = useToast();
        const purchaseStore = usePurchaseOrderStore();

        /** File pre-filled from SmartScan — forwarded to DeliveryInfo as attachment */
        const scanAttachment = ref<File | null>(null);

        const deliveryData = ref({
            deliveryInfo: {},
            selectPO: {},
            verifyItem: {},
            review: {}
        });

        // ---------------------------
        // 2. COMPUTED PROPERTIES
        // ---------------------------
        const canPassToReview = computed(() => {
            return (
                deliveryData.value.deliveryInfo &&
                Object.keys(deliveryData.value.deliveryInfo).length > 0 &&
                deliveryData.value.selectPO &&
                Object.keys(deliveryData.value.selectPO).length > 0 &&
                deliveryData.value.verifyItem &&
                Array.isArray(deliveryData.value.verifyItem) &&
                deliveryData.value.verifyItem.length > 0
            );
        });

        // ---------------------------
        // 3. FUNCTIONS (handlers, business logic)
        // ---------------------------
        const handleStep1Update = (data: any) => {
            deliveryData.value.selectPO = data;
            activeStep.value = 2;
        };

        const handleStep2Update = (data: any) => {
            deliveryData.value.verifyItem = data;

            activeStep.value = 3;
        };

        const handleStep3Update = (data: any) => {
            deliveryData.value.deliveryInfo = data;
            activeStep.value = 4;
        };

        const goStep = (step: number) => {
            activeStep.value = step;
        };

        /**
         * Called when user confirms the SmartScan OCR result.
         * Tries to match the detected SO number against loaded purchase orders.
         * If found → auto-fill step 1 data, store the scanned file, jump to step 3.
         */
        const handleSmartScan = (result: OcrResult) => {
            const soNo = result.soNo?.trim();

            // Match by: DocNo directly (DocNo IS the SO number in this system),
            // OR by SoDocNo in raw purchase_order_items (preserves SoDocNo from API),
            // OR by SoDocNo in mapped PurchaseOrderItems (fallback)
            const matchedPO = purchaseStore.purchaseOrders.find((po) =>
                po.DocNo === soNo ||
                (po.purchase_order_items ?? []).some((item: any) => item.SoDocNo === soNo) ||
                (po.PurchaseOrderItems ?? []).some((item: any) => item.SoDocNo === soNo || item.soDocNo === soNo)
            );

            if (matchedPO) {
                const items = matchedPO.purchase_order_items ?? matchedPO.PurchaseOrderItems ?? [];

                // Populate step 1 data as if user manually selected the PO
                deliveryData.value.selectPO = {
                    id: matchedPO.Id,
                    poNumber: matchedPO.DocNo,
                    items
                };

                // Store the uploaded file to pre-fill delivery attachments in step 3
                scanAttachment.value = result.sourceFile ?? null;

                toast.add({
                    severity: 'success',
                    summary: 'Smart Scan Matched!',
                    detail: `SO ${soNo} matched to PO ${matchedPO.DocNo}. Proceeding to Delivery Info.`,
                    life: 4000
                });

                // Skip steps 1 & 2 — jump straight to step 3 (Delivery Info)
                activeStep.value = 3;
            } else {
                toast.add({
                    severity: 'warn',
                    summary: 'No PO Found',
                    detail: `Could not find a Purchase Order linked to SO ${soNo}. Please select manually.`,
                    life: 4000
                });
            }
        };

        const handleSmartScanManual = () => {
            // User chose to enter manually — stay on step 1
            activeStep.value = 1;
        };

        // ---------------------------
        // 5. RETURN (expose to template)
        // ---------------------------
        return {
            activeStep,
            deliveryData,
            canPassToReview,
            scanAttachment,
            handleStep1Update,
            handleStep2Update,
            handleStep3Update,
            goStep,
            handleSmartScan,
            handleSmartScanManual
        };
    }
});
