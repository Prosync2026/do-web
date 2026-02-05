import type { FormValues, UploadFile } from '@/types/delivery.type';
import { formatDateToAPI } from '@/utils/dateHelper';
import Form, { FormResolverOptions, FormSubmitEvent } from '@primevue/forms/form';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Card from 'primevue/card';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { defineComponent, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'DeliveryFormCard',
    components: {
        Card,
        InputText,
        Button,
        Message,
        Toast,
        Form,
        Calendar,
        Textarea,
        FileUpload,
        ProgressBar,
        Badge
    },
    emits: ['update'],
    setup(_, { emit }) {
        const router = useRouter();
        const toast = useToast();
        const toastRef = ref<InstanceType<typeof Toast> | null>(null);

        const initialValues = reactive<FormValues>({
            driverPlate: '',
            deliveryDate: null,
            remarks: ''
        });

        const errors = reactive<{ driverPlate?: string; deliveryDate?: string }>({});

        // -------------------------------------------------------
        // MAIN ATTACHMENTS (with preview)
        // -------------------------------------------------------
        const deliveryAttachments = ref<UploadFile[]>([]);
        const totalSize = ref(0);
        const totalSizePercent = ref(0);

        // -------------------------------------------------------
        // EVIDENCE ATTACHMENTS (with preview)
        // -------------------------------------------------------
        const evidenceFiles = ref<UploadFile[]>([]);
        const evidenceTotalSize = ref(0);
        const evidenceTotalSizePercent = ref(0);

        // -------------------------------------------------------
        const formatSize = (bytes: number) => {
            const k = 1024;
            const dm = 2;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return `0 ${sizes[0]}`;
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
        };

        const resolver = (options: FormResolverOptions) => {
            const values = options.values as FormValues;
            errors.driverPlate = '';
            errors.deliveryDate = '';

            return { values, errors };
        };

        const onSelectedFiles = (event: { files: File[] }) => {
            const newFiles = event.files.map((f) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                raw: f,
                preview: URL.createObjectURL(f)
            }));

            // Check for duplicates before adding
            const existingNames = new Set(deliveryAttachments.value.map((f) => f.name));
            const uniqueNewFiles = newFiles.filter((f) => !existingNames.has(f.name));

            if (uniqueNewFiles.length > 0) {
                deliveryAttachments.value.push(...uniqueNewFiles);
            }

            totalSize.value = deliveryAttachments.value.reduce((sum, f) => sum + f.size, 0);
            totalSizePercent.value = (totalSize.value / 10_000_000) * 100;
        };

        const onRemoveFile = (file: UploadFile, removeCallback: (index: number) => void, index: number) => {
            removeCallback(index);

            if (file.preview) URL.revokeObjectURL(file.preview);

            deliveryAttachments.value.splice(index, 1);

            totalSize.value = deliveryAttachments.value.reduce((sum, f) => sum + f.size, 0);
            totalSizePercent.value = (totalSize.value / 10_000_000) * 100;
        };

        const onSelectedEvidenceFiles = (event: { files: File[] }) => {
            const newFiles = event.files.map((f) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                raw: f,
                preview: URL.createObjectURL(f)
            }));

            // Check for duplicates before adding
            const existingNames = new Set(evidenceFiles.value.map((f) => f.name));
            const uniqueNewFiles = newFiles.filter((f) => !existingNames.has(f.name));

            if (uniqueNewFiles.length > 0) {
                evidenceFiles.value.push(...uniqueNewFiles);
            }

            evidenceTotalSize.value = evidenceFiles.value.reduce((s, f) => s + f.size, 0);
            evidenceTotalSizePercent.value = (evidenceTotalSize.value / 10_000_000) * 100;
        };

        const onRemoveEvidenceFile = (file: UploadFile, removeCallback: (index: number) => void, index: number) => {
            removeCallback(index);

            if (file.preview) URL.revokeObjectURL(file.preview);

            evidenceFiles.value.splice(index, 1);

            evidenceTotalSize.value = evidenceFiles.value.reduce((s, f) => s + f.size, 0);
            evidenceTotalSizePercent.value = (evidenceTotalSize.value / 10_000_000) * 100;
        };

        // -------------------------------------------------------
        const uploadEvent = (callback: () => void) => callback();

        const onFormSubmit = async (event: FormSubmitEvent<Record<string, any>>) => {
            const values = event.values as FormValues;

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
                attachments: deliveryAttachments.value.map((f) => f.raw), // Delivery documents
                attachments2: evidenceFiles.value.map((f) => f.raw) // Evidence/photos sent as attachments2
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
            totalSize,
            totalSizePercent,

            evidenceFiles,
            evidenceTotalSize,
            evidenceTotalSizePercent,

            toastRef,
            formatSize,
            resolver,
            onFormSubmit,
            onSelectedFiles,
            onRemoveFile,
            onSelectedEvidenceFiles,
            onRemoveEvidenceFile,
            uploadEvent,
            goBack
        };
    }
});
