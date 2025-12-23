import type { BcrRoleConfig } from '@/constants/enum/bcrApproval.constants';
import { BcrReasonEnum, BcrRecommendationEnum, BcrRoleEnum } from '@/constants/enum/bcrApproval.enum';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRRecommendationPayload } from '@/types/budgetChangeRequest.type';
import { getRoleConfig } from '@/utils/bcrApproval.utils';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

interface AdjustmentItem {
    id: number | null;
    code: string | null;
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

        const reasonSelection = ref<BcrReasonEnum | ''>('');
        const selection = ref<BcrRecommendationEnum | ''>('');
        const remark = ref('');
        const adjustments = ref<AdjustmentItem[]>([]);
        const selectedFiles = ref<File[]>([]);

        // Dynamic Options (初始化为空数组，避免 TS undefined)
        const reasonOptions = ref<BcrRoleConfig['reasons']>([]);
        const recommendationOptions = ref<BcrRoleConfig['recommendations']>([]);
        const budgetItemList = ref<any[]>([]);

        onMounted(() => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            user.value.role = storedUser.user_project_role_code || '';
            user.value.username = storedUser.username || 'Unknown User';

            const roleConfig: BcrRoleConfig = getRoleConfig(user.value.role as BcrRoleEnum);
            reasonOptions.value = roleConfig.reasons ?? [];
            recommendationOptions.value = roleConfig.recommendations ?? [];
        });

        // Show Adjustment List only when recommendation = CHANGE_BUDGET
        const showAdjustmentList = computed(() => selection.value === BcrRecommendationEnum.CHANGE_BUDGET);

        function addAdjustment() {
            adjustments.value.push({ id: null, code: null, value: '' });
        }

        function removeAdjustment(index: number) {
            adjustments.value.splice(index, 1);
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

        function handleSubmit() {
            if (!remark.value.trim()) {
                toast.add({
                    severity: 'warn',
                    summary: 'Remark Required',
                    detail: 'Please enter your remark before submitting.',
                    life: 3000
                });
                return;
            }

            const payload: BCRRecommendationPayload = {
                Department: user.value.role,
                PersonInCharge: user.value.username,
                RecommendationType: selection.value,
                Remark: remark.value,
                files: [],
                RecommendedItems: adjustments.value.map((a) => ({
                    BudgetChangeItemId: a.id!,
                    RecommendedQty: Number(a.value)
                }))
            };

            budgetCRStore
                .createBCRRecommendation(budgetChangeRequestId, payload, selectedFiles.value)
                .then(() => {
                    selection.value = '';
                    reasonSelection.value = '';
                    remark.value = '';
                    adjustments.value = [];
                    selectedFiles.value = [];
                    emit('update:visible', false);
                    emit('submit');
                })
                .catch(() => {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit recommendation', life: 3000 });
                });
        }

        return {
            user,
            reasonOptions,
            recommendationOptions,
            reasonSelection,
            selection,
            remark,
            adjustments,
            addAdjustment,
            removeAdjustment,
            showAdjustmentList,
            budgetItemList,
            selectedFiles,
            onFileSelect,
            handleSubmit
        };
    }
});
