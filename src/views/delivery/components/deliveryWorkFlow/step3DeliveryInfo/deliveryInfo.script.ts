import { PhWarningCircle, PhTruck, PhFile, PhCamera } from '@phosphor-icons/vue';
import { formatDateToAPI } from '@/utils/dateHelper';
import Calendar from 'primevue/calendar';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useToast } from '@/utils/toastBus';
import { defineComponent, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ProCard, ProButton, ProTag, ProInput, ProTextarea, ProUploadFile } from '@prosync_solutions/ui';

export default defineComponent({
    name: 'DeliveryFormCard',
    components: { Message, Toast, Calendar, ProCard, ProButton, ProTag, ProInput, ProTextarea, ProUploadFile, PhWarningCircle, PhTruck, PhFile, PhCamera },
    props: {
        prefillAttachment: {
            type: File,
            default: null
        },
        prefillPlate: {
            type: String,
            default: ''
        }
    },
    emits: ['update'],
    setup(props, { emit }) {
        const router = useRouter();
        const toast = useToast();
        const toastRef = ref<InstanceType<typeof Toast> | null>(null);

        const initialValues = reactive<FormValues>({
            driverPlate: '',
            deliveryDate: null,
            remarks: ''
        });

        const errors = reactive<{ driverPlate?: string; deliveryDate?: string }>({});

        // MAIN ATTACHMENTS (with preview)
        const deliveryAttachments = ref<any[]>([]);

        // Pre-fill with the SmartScan uploaded file and/or lorry plate if provided
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
            const values = initialValues;

            errors.driverPlate = '';
            errors.deliveryDate = '';

            if (!values.driverPlate?.trim()) {
                errors.driverPlate = 'Driver Plate Number is required.';
            }

            if (!values.deliveryDate) {
                errors.deliveryDate = 'Delivery Date is required.';
            }

            if (errors.driverPlate || errors.deliveryDate) {
                if (errors.driverPlate) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Driver Plate Number Missing',
                        detail: errors.driverPlate,
                        life: 2500
                    });
                }

                if (errors.deliveryDate) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Delivery Date Missing',
                        detail: errors.deliveryDate,
                        life: 2500
                    });
                }

                return;
            }

            //  SEPARATED: attachments and attachments2
            const dataToEmit = {
                PlateNo: values.driverPlate,
                Date: formatDateToAPI(values.deliveryDate) || '',
                DeliveryDate: formatDateToAPI(values.deliveryDate) || '',
                Remarks: values.remarks || '',
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

        const goBack = () => router.push('/deliveries');

        return {
            initialValues,
            errors,

            deliveryAttachments,
            evidenceFiles,

            toastRef,
            onFormSubmit,
            goBack
        };
    }
});
