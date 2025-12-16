import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRRecommendationEditPayload, DiscussionItem } from '@/types/budgetChangeRequest.type';
import { useToast } from 'primevue/usetoast';
import { defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    props: {
        visible: { type: Boolean, required: true },
        item: { type: Object as () => DiscussionItem, required: true }
    },
    emits: ['update:visible', 'submit'],

    setup(props, { emit }) {
        const route = useRoute();
        const budgetChangeRequestId = Number(route.params.budgetChangeRequestId);

        const budgetCRStore = useBudgetChangeRequestStore();
        const toast = useToast();

        const selection = ref<string>('');
        const specificQuantity = ref<string>('');
        const remark = ref<string>('');
        const selectedFiles = ref<File[]>([]);

        const user = ref({ role: '', username: '' });
        const existingDocuments = ref<{ id: number; filename: string; path: string }[]>([]);

        onMounted(() => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            user.value.role = storedUser.role || 'Project Director';
            user.value.username = storedUser.username || 'Unknown User';
        });

        watch(
            () => props.item,
            (item) => {
                if (!item) return;
                selection.value = item.selectionType || '';
                specificQuantity.value = item.quantity?.toString() || '';
                remark.value = item.message || '';
                selectedFiles.value = [];
                existingDocuments.value = (item.documentUrl || []).map((doc: any, index: number) => ({
                    id: doc.id ?? index,
                    filename: doc.filename,
                    path: doc.path
                }));
            },
            { immediate: true }
        );

        const getFileUrl = (path: string) => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            return `${baseUrl}/${path.replace(/\\/g, '/')}`;
        };

        function onFileSelect(event: { files: File[] }) {
            selectedFiles.value = event.files;
            toast.add({
                severity: 'info',
                summary: 'Files Attached',
                detail: `${event.files.length} file(s) added`,
                life: 2500
            });
        }
        async function handleSubmit() {
            if (!remark.value.trim()) {
                toast.add({
                    severity: 'warn',
                    summary: 'Remark Required',
                    detail: 'Please enter your remark before submitting.',
                    life: 3000
                });
                return;
            }

            const payload: BCRRecommendationEditPayload = {
                RecommendationType: selection.value,
                SpecificQuantity: selection.value === 'Specific_Quantity' ? Number(specificQuantity.value) : null,
                Remark: remark.value
            };

            try {
                await budgetCRStore.editBCRRecommendation(budgetChangeRequestId, props.item.id!, payload, selectedFiles.value);

                selection.value = '';
                specificQuantity.value = '';
                remark.value = '';
                selectedFiles.value = [];

                emit('update:visible', false);
                emit('submit');
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to submit recommendation',
                    life: 3000
                });
            }
        }

        return {
            selection,
            specificQuantity,
            remark,
            selectedFiles,
            user,
            existingDocuments,
            onFileSelect,
            handleSubmit,
            getFileUrl
        };
    }
});
