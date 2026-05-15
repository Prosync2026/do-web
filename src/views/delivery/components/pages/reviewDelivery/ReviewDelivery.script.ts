import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import { useToast } from '@/utils/toastBus';
import { ProCard, ProButton, ProTag, ProInput } from '@prosync_solutions/ui';
import { PhCheck, PhTrash, PhPlus } from '@phosphor-icons/vue';

export default defineComponent({
    name: 'ReviewDelivery',
    components: { ProCard, ProButton, ProTag, ProInput, PhCheck, PhTrash, PhPlus },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const deliveryStore = useDeliveryStore();
        const toast = useToast();

        const deliveryOrderId = Number(route.params.deliveryOrderId);
        
        const deliveryOrder = ref<any>({});
        const extractedItems = ref<any[]>([]);
        const selectedFile = ref<File | null>(null);
        const filePreviewUrl = ref<string | null>(null);

        onMounted(() => {
            // Find the mock DO from store
            const foundDO: any = deliveryStore.list.find((d: any) => d.Id === deliveryOrderId);
            
            if (foundDO) {
                // clone so we don't directly mutate store until save
                deliveryOrder.value = { ...foundDO };
                
                // load extracted items and add default split
                if (foundDO._aiExtractedItems) {
                    extractedItems.value = foundDO._aiExtractedItems.map((item: any) => ({
                        ...item,
                        splits: [
                            {
                                delivered: item.qty,
                                received: item.qty,
                                location: '',
                                remarks: ''
                            }
                        ]
                    }));
                }
                
                // load file preview
                if (foundDO._sourceFile) {
                    selectedFile.value = foundDO._sourceFile;
                    filePreviewUrl.value = URL.createObjectURL(foundDO._sourceFile);
                }
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Not Found',
                    detail: 'Delivery order not found.',
                    life: 3000
                });
                router.push('/deliveries');
            }
        });

        onUnmounted(() => {
            if (filePreviewUrl.value) {
                URL.revokeObjectURL(filePreviewUrl.value);
            }
        });

        const handleCancel = () => {
            router.push('/deliveries');
        };

        const handleMarkAsReviewed = () => {
            // Update the store item
            const docIndex = deliveryStore.list.findIndex(d => d.Id === deliveryOrderId);
            if (docIndex !== -1) {
                // Move from Ready for Review to Completed/Created or however the backend usually works
                // For now, let's mark it as 'Created' so it enters the normal flow, or 'Completed'
                deliveryStore.list[docIndex].Status = 'Created'; 
                
                toast.add({
                    severity: 'success',
                    summary: 'Reviewed Successfully',
                    detail: `${deliveryOrder.value.DocNo} has been marked as reviewed.`,
                    life: 3000
                });
            }
            router.push('/deliveries');
        };

        const addSplit = (item: any) => {
            item.splits.push({
                delivered: '',
                received: '',
                location: '',
                remarks: ''
            });
        };

        const removeSplit = (item: any, splitIndex: number | string) => {
            item.splits.splice(Number(splitIndex), 1);
            if (item.splits.length === 0) {
                // ensure at least one split exists if required, or let it be empty
            }
        };

        return {
            deliveryOrder,
            extractedItems,
            selectedFile,
            filePreviewUrl,
            handleCancel,
            handleMarkAsReviewed,
            addSplit,
            removeSplit
        };
    }
});
