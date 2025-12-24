import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRRecommendationPayload } from '@/types/budgetChangeRequest.type';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

interface AdjustmentItem {
    id: number | null; // 对应 BudgetChangeItemId
    code: string | null; // 显示 ItemCode
    value: string;
}

export default defineComponent({
    props: { visible: { type: Boolean, required: true } },
    emits: ['update:visible', 'submit'],

    setup(props, { emit }) {
        const route = useRoute();
        const toast = useToast();
        const budgetCRStore = useBudgetChangeRequestStore();
        const budgetChangeRequestId = Number(route.params.budgetChangeRequestId);

        const user = ref({ role: '', username: '' });
        const singleBudgetChangeRequest = ref<any>(null);
        const adjustments = ref<AdjustmentItem[]>([]);
        const selection = ref<string>('');
        const remark = ref<string>('');
        const selectedFiles = ref<File[]>([]);

        onMounted(async () => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            user.value.role = storedUser.role || 'Project Director';
            user.value.username = storedUser.username || 'Unknown User';

            if (budgetChangeRequestId) {
                const data = await budgetCRStore.getSingleBudgetChange(budgetChangeRequestId);
                singleBudgetChangeRequest.value = data;
                console.log('🔥 singleBudgetChangeRequest:', singleBudgetChangeRequest.value);
            }
        });

        const budgetItemList = computed(() => singleBudgetChangeRequest.value?.budget_change_items || []);

        function addAdjustment() {
            adjustments.value.push({ id: null, code: null, value: '' });
        }

        function removeAdjustment(index: number) {
            adjustments.value.splice(index, 1);
        }
        // HERE IN THE API WANT TO CHANGE CORRECT , SITE = PM
        function normalizeDepartment(dept: string | null): string {
            if (!dept) return '';
            const lower = dept.toLowerCase();
            if (lower === 'site staff' || lower === 'site' || lower === 'project manager') return 'Site';
            return dept;
        }

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

            const recommendedItems = adjustments.value
                .filter((a) => a.id != null && a.value)
                .map((a) => ({
                    BudgetChangeItemId: a.id!,
                    RecommendedQty: Number(a.value)
                }));

            const payload: BCRRecommendationPayload = {
                Department: normalizeDepartment(user.value.role),
                PersonInCharge: user.value.username,
                RecommendationType: selection.value,
                Remark: remark.value,
                files: [],
                RecommendedItems: recommendedItems
            };

            try {
                await budgetCRStore.createBCRRecommendation(budgetChangeRequestId, payload, selectedFiles.value);
                // Reset
                selection.value = '';
                remark.value = '';
                adjustments.value = [];
                selectedFiles.value = [];
                emit('update:visible', false);
                emit('submit');
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit recommendation', life: 3000 });
            }
        }

        return {
            user,
            selection,
            remark,
            selectedFiles,
            adjustments,
            budgetItemList,
            addAdjustment,
            removeAdjustment,
            onFileSelect,
            handleSubmit
        };
    }
});
