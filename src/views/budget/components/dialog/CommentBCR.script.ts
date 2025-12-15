import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRRecommendationPayload } from '@/types/budgetChangeRequest.type';
import { useToast } from 'primevue/usetoast';
import { defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    props: {
        visible: {
            type: Boolean,
            required: true
        }
    },
    emits: ['update:visible', 'submit'],

    setup(props, { emit }) {
        const route = useRoute();
        const budgetChangeRequestId = Number(route.params.budgetChangeRequestId);

        const budgetCRStore = useBudgetChangeRequestStore();
        const toast = useToast();

        // Form fields
        const selection = ref<string>('');
        const specificQuantity = ref<string>('');
        const remark = ref<string>('');

        // Selected files (manual upload)
        const selectedFiles = ref<File[]>([]);

        // User info from localStorage
        const user = ref({ role: '', username: '' });

        onMounted(() => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            user.value.role = storedUser.role || 'Project Director';
            user.value.username = storedUser.username || 'Unknown User';
        });

        // When user selects files
        function onFileSelect(event: any) {
            selectedFiles.value = event.files;
            toast.add({
                severity: 'info',
                summary: 'Files Attached',
                detail: `${event.files.length} file(s) added`,
                life: 2500
            });
        }

        const normalizeDepartment = (dept: string | null): string => {
            if (!dept) return '';

            const lower = dept.toLowerCase();

            if (lower === 'site staff' || lower === 'site') return 'Site';

            return dept;
        };

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

            const normalizedDept = normalizeDepartment(user.value.role);
            const payload: BCRRecommendationPayload = {
                Department: normalizedDept,
                PersonInCharge: user.value.username,
                RecommendationType: selection.value,
                SpecificQuantity: selection.value === 'Specific_Quantity' ? Number(specificQuantity.value) : null,
                Remark: remark.value,
                files: []
            };

            try {
                await budgetCRStore.createBCRRecommendation(budgetChangeRequestId, payload, selectedFiles.value);
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
            onFileSelect,
            handleSubmit
        };
    }
});
