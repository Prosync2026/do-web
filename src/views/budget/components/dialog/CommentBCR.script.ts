import type { BcrRoleConfig } from '@/constants/enum/bcrApproval.constants';
import { BcrReasonEnum, BcrRecommendationEnum, BcrRoleEnum } from '@/constants/enum/bcrApproval.enum';
import { budgetChangeRequestService } from '@/services/budgetChangeRequest.service';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRFinalDecisionPayload, BCRRecommendationPayload } from '@/types/budgetChangeRequest.type';
import { getRoleConfig } from '@/utils/bcrApproval.utils';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
interface AdjustmentItem {
    id: number | null;
    ItemCode: string | null;
    value: string;
    Description: string | null;
    OrderedQty: string | null;
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
        const showAdjustmentList = computed(() => selection.value === BcrRecommendationEnum.Specific_Quantity);

        function addAdjustment() {
            adjustments.value.push({
                id: null,
                ItemCode: '',
                Description: '',
                OrderedQty: '',
                value: ''
            });
        }

        function removeAdjustment(index: number) {
            adjustments.value.splice(index, 1);
        }

        function onSelectItem(rowItem: any) {
            const selected = budgetItemList.value.find((b) => b.Id === rowItem.Id);
            if (selected) {
                rowItem.id = selected.Id;
                rowItem.ItemCode = selected.ItemCode;
                rowItem.Description = selected.Description;
                rowItem.OrderedQty = selected.OrderedQty;
            }
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

        onMounted(async () => {
            if (budgetChangeRequestId) {
                const data = await budgetCRStore.getSingleBudgetChange(budgetChangeRequestId);

                if (data?.budget_change_items) {
                    budgetItemList.value = data.budget_change_items.map((item: any) => ({
                        Id: item.Id,
                        ItemCode: item.ItemCode,
                        Description: item.Description,
                        OrderedQty: item.OrderedQty
                    }));
                }
            }
        });

        function handleSubmit() {
            const payload: BCRRecommendationPayload = {
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

        function handleReviewSubmit(action: 'approve' | 'reject') {
            const payload: BCRFinalDecisionPayload = {
                ReviewType: selection.value,
                Remark: remark.value
            };

            if (selection.value === BcrRecommendationEnum.Specific_Quantity) {
                payload.ReviewedItems = adjustments.value.map((a) => ({
                    BudgetChangeItemId: Number(a.id),
                    ApprovedQty: Number(a.value)
                }));
            }

            budgetChangeRequestService.rolesReviewRecommendation(budgetChangeRequestId, payload).then(() => {
                selection.value = '';
                reasonSelection.value = '';
                remark.value = '';
                adjustments.value = [];
                selectedFiles.value = [];
                emit('update:visible', false);
                emit('submit');
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
            onSelectItem,
            removeAdjustment,
            handleReviewSubmit,
            showAdjustmentList,
            budgetItemList,
            selectedFiles,
            onFileSelect,
            handleSubmit
        };
    }
});
