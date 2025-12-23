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
        const adjustments = ref<{ id: number | null; value: string }[]>([]);
        const selectedFiles = ref<File[]>([]);

        const reasonOptions = ref<BcrRoleConfig['reasons']>([]);
        const recommendationOptions = ref<BcrRoleConfig['recommendations']>([]);
        const budgetItemList = ref<any[]>([]);

        onMounted(() => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            user.value.role = storedUser.user_project_role_code || '';
            user.value.username = storedUser.username || '';

            const roleConfig = getRoleConfig(user.value.role as BcrRoleEnum);
            reasonOptions.value = roleConfig.reasons ?? [];
            recommendationOptions.value = roleConfig.recommendations ?? [];
        });

        watch(
            () => props.item,
            (item) => {
                if (!item) return;

                // reasonSelection.value = item.reason ?? '';
                // selection.value = item.selectionType ?? '';
                remark.value = item.message ?? '';

                // adjustments.value =
                //     item.adjustments?.map((a) => ({
                //         id: a.BudgetChangeItemId,
                //         value: a.RecommendedQty?.toString() ?? ''
                //     })) ?? [];

                selectedFiles.value = [];
            },
            { immediate: true }
        );

        const showAdjustmentList = computed(() => selection.value === BcrRecommendationEnum.CHANGE_BUDGET);

        function addAdjustment() {
            adjustments.value.push({ id: null, value: '' });
        }

        function removeAdjustment(index: number) {
            adjustments.value.splice(index, 1);
        }

        function onFileSelect(event: { files: File[] }) {
            selectedFiles.value = event.files;
        }

        // async function handleSubmit() {
        //     if (!remark.value.trim()) {
        //         toast.add({
        //             severity: 'warn',
        //             summary: 'Remark Required',
        //             detail: 'Please enter your remark before submitting.',
        //             life: 3000
        //         });
        //         return;
        //     }

        //     const payload: BCRRecommendationEditPayload = {
        //         RecommendationType: selection.value,
        //         Remark: remark.value,
        //         RecommendedItems: showAdjustmentList.value
        //             ? adjustments.value.map((a) => ({
        //                   BudgetChangeItemId: a.id!,
        //                   RecommendedQty: Number(a.value)
        //               }))
        //             : []
        //     };

        //     await budgetCRStore.editBCRRecommendation(budgetChangeRequestId, props.item.id!, payload, selectedFiles.value);

        //     emit('update:visible', false);
        //     emit('submit');
        // }

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
            addAdjustment,
            removeAdjustment,
            onFileSelect
        };
    }
});
