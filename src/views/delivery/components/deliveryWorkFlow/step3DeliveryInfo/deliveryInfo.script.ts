import { PhWarningCircle, PhTruck, PhFile, PhCamera } from '@phosphor-icons/vue';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useToast } from '@/utils/toastBus';
import { defineComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ProCard, ProButton, ProUploadFile } from '@prosync_solutions/ui';

export default defineComponent({
    name: 'DeliveryInfo',
    components: { Message, Toast, ProCard, ProButton, ProUploadFile, PhWarningCircle, PhTruck, PhFile, PhCamera },
    props: {
        prefillAttachment: {
            type: File,
            default: null
        }
    },
    emits: ['update', 'prev-step'],
    setup(props, { emit }) {
        const router = useRouter();
        const toast = useToast();
        const toastRef = ref<InstanceType<typeof Toast> | null>(null);

        const deliveryAttachments = ref<any[]>([]);

        // Pre-fill with the SmartScan uploaded file if provided

        watch(
            () => props.prefillAttachment,
            (newAttachment) => {
                if (newAttachment) {
                    // Check if already have it to avoid duplicates
                    const exists = deliveryAttachments.value.some((a) => a.name === newAttachment.name);
                    if (!exists) {
                        const f = newAttachment;
                        deliveryAttachments.value.push({
                            id: f.name,
                            file: f,
                            name: f.name,
                            size: f.size,
                            type: f.type,
                            status: 'done',
                            url: f.type.startsWith('image') ? URL.createObjectURL(f) : undefined
                        });
                    }
                }
            },
            { immediate: true }
        );

        // EVIDENCE ATTACHMENTS (with preview)
        const evidenceFiles = ref<any[]>([]);

        // -------------------------------------------------------
        const uploadEvent = (callback: () => void) => callback();

        const onFormSubmit = async () => {
            //  SEPARATED: attachments and attachments2
            const dataToEmit = {
                attachments: deliveryAttachments.value.map((f: any) => f.file || f.raw || f), // Delivery documents
                attachments2: evidenceFiles.value.map((f: any) => f.file || f.raw || f) // Evidence/photos sent as attachments2
            };

            emit('update', dataToEmit);

            const totalFiles = dataToEmit.attachments.length + dataToEmit.attachments2.length;
            toast.add({
                severity: 'success',
                summary: 'Data Ready',
                detail: `Uploaded ${totalFiles} total file(s).`,
                life: 2500
            });
        };

        const goBack = () => {
            emit('prev-step');
        };

        return {
            deliveryAttachments,
            evidenceFiles,

            toastRef,
            onFormSubmit,
            goBack
        };
    }
});
