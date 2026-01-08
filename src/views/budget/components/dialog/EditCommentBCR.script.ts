import type { BcrRoleConfig } from '@/constants/enum/bcrApproval.constants';
import { BcrRecommendationEnum, BcrRoleEnum } from '@/constants/enum/bcrApproval.enum';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { DiscussionItem } from '@/types/budgetChangeRequest.type';
import { getRoleConfig } from '@/utils/bcrApproval.utils';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    props: {
        visible: { type: Boolean, required: true },
        item: { type: Object as () => DiscussionItem, required: true }
    },
    emits: ['update:visible', 'submit'],

    setup(props, { emit }) {
        const route = useRoute();
        const toast = useToast();
        const budgetCRStore = useBudgetChangeRequestStore();
        const budgetChangeRequestId = Number(route.params.budgetChangeRequestId);

        const user = ref({ role: '', username: '' });
        const reasonSelection = ref('');
        const selection = ref<BcrRecommendationEnum | ''>('');
        const remark = ref('');
        const adjustments = ref<{ id: number | null; ItemCode?: string; Description?: string; OrderedQty?: number | undefined; value?: string }[]>([]);
        const selectedFiles = ref<File[]>([]);
        const existingDocuments = ref<{ id: number; filename: string; path: string }[]>([]);
        const reasonOptions = ref<BcrRoleConfig['reasons']>([]);
        const recommendationOptions = ref<BcrRoleConfig['recommendations']>([]);
        const budgetItemList = ref<any[]>([]);

        // 显示 Adjustment List 仅在 CHANGE_BUDGET / Specific_Quantity
        const showAdjustmentList = computed(() => selection.value === BcrRecommendationEnum.Specific_Quantity);

        function addAdjustment() {
            adjustments.value.push({
                id: null,
                ItemCode: '',
                Description: '',
                OrderedQty: 0,
                value: ''
            });
        }

        function removeAdjustment(index: number) {
            adjustments.value.splice(index, 1);
        }

        function onSelectItem(rowItem: { id: number | null; ItemCode?: string; Description?: string; OrderedQty?: number; value?: string }) {
            const selected = budgetItemList.value.find((b) => b.Id === rowItem.id);
            if (selected) {
                rowItem.ItemCode = selected.ItemCode;
                rowItem.Description = selected.Description;
                rowItem.OrderedQty = Number(selected.OrderedQty);
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
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        user.value.role = storedUser.user_project_role_code || '';
        user.value.username = storedUser.username || '';
        onMounted(async () => {
            const roleConfig = getRoleConfig(user.value.role as BcrRoleEnum);
            reasonOptions.value = roleConfig.reasons ?? [];
            recommendationOptions.value = roleConfig.recommendations ?? [];

            if (budgetChangeRequestId) {
                const data = await budgetCRStore.getSingleBudgetChange(budgetChangeRequestId);

                if (data?.budget_change_items) {
                    budgetItemList.value = data.budget_change_items.map((item: any) => ({
                        Id: item.Id,
                        ItemCode: item.ItemCode,
                        Description: item.Description,
                        OrderedQty: Number(item.OrderedQty)
                    }));
                }
            }
        });

        watch(
            () => props.item,
            (item) => {
                if (!item) return;
                console.log('item checking data', item);
                reasonSelection.value = item.Reason ?? '';
                selection.value = Object.values(BcrRecommendationEnum).includes(item.RecommendationType as BcrRecommendationEnum) ? (item.RecommendationType as BcrRecommendationEnum) : '';
                remark.value = item.Remark ?? '';

                adjustments.value =
                    item.recommendationItem?.map((a) => ({
                        id: a.BudgetChangeItemId ?? null,
                        ItemCode: a.ItemCode,
                        OrderedQty: a.OrderedQty ? Number(a.OrderedQty) : 0,
                        value: a.RecommendedQty ? a.RecommendedQty.toString() : ''
                    })) ?? [];

                selectedFiles.value = [];
                existingDocuments.value = (item.documentUrl || []).map((doc: any, index: number) => ({
                    id: doc.id ?? index,
                    filename: doc.filename,
                    path: doc.path
                }));
            },
            { immediate: true }
        );
        async function handleSubmit() {
            const payload = {
                RecommendationType: selection.value,
                Remark: remark.value,
                RecommendedItems: showAdjustmentList.value
                    ? adjustments.value.map((a) => ({
                          BudgetChangeItemId: a.id!,
                          RecommendedQty: Number(a.value)
                      }))
                    : []
            };

            await budgetCRStore.editBCRRecommendation(budgetChangeRequestId, props.item.id!, payload, selectedFiles.value);

            emit('update:visible', false);
            emit('submit');
        }
        // Only QS or PM can upload attachments
        const showAttachment = computed(() => user.value.role === BcrRoleEnum.QS || user.value.role === BcrRoleEnum.PM);

        return {
            user,
            reasonOptions,
            recommendationOptions,
            reasonSelection,
            selection,
            remark,
            adjustments,
            showAdjustmentList,
            budgetItemList,
            selectedFiles,
            existingDocuments,
            addAdjustment,
            removeAdjustment,
            onSelectItem,
            onFileSelect,
            handleSubmit,
            showAttachment
        };
    }
});
