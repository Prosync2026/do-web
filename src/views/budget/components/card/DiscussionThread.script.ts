import { PhTreeStructure, PhCaretRight, PhXCircle, PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue';
import { defineComponent, onMounted, ref, markRaw } from 'vue';
import { useRoute } from 'vue-router';

import { ProButton, ProCard, ProDivider, ProEmpty, ProTag, ProToast, ProTooltip } from '@prosync_solutions/ui';

import { budgetChangeRequestService } from '@/services/budgetChangeRequest.service';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { DiscussionItem, ReviewList } from '@/types/budgetChangeRequest.type';
import { formatDate } from '@/utils/dateHelper';
import commentBCRModal from '@/views/budget/components/dialog/CommentBCR.vue';
import editcommentBCRModal from '@/views/budget/components/dialog/EditCommentBCR.vue';

export default defineComponent({
    name: 'DiscussionThread',
    components: { ProButton, ProTag, ProCard, ProDivider, ProEmpty, ProTooltip, ProToast, editcommentBCRModal, commentBCRModal, PhTreeStructure, PhCaretRight, PhXCircle, PhCheckCircle, PhWarningCircle },
    props: {
        editMode: {
            type: Boolean,
            default: true
        }
    },
    setup(props) {
        const route = useRoute();
        const store = useBudgetChangeRequestStore();

        const toastState = ref({ visible: false, message: '', type: 'information' as 'information' | 'success' | 'warn' | 'error' });
        const showToastMsg = (type: 'information' | 'success' | 'warn' | 'error', message: string) => {
            toastState.value = { visible: true, message, type };
        };

        const showApprovalFlow = ref(true);
        const active = ref<string[]>([]);

        const createComment = ref(false);
        const editComment = ref(false);
        const editingItem = ref<DiscussionItem | null>(null);
        const canRecommend = ref(true);

        const discussions = ref<DiscussionItem[]>([]);
        const currentUserRole = ref<string | null>(null);

        const ROLE_ORDER = ['QS', 'CM', 'SITE', 'PD', 'MGM', 'PURC'];
        const CREATOR_ROLES = ['QS', 'SITE'];

        const fetchCombinedDiscussion = async () => {
            const bcrId = Number(route.params.budgetChangeRequestId);

            const discussionRes = await store.fetchRecommendationList(bcrId);
            const reviewRes = await budgetChangeRequestService.fetchReviewList(bcrId);

            const reviews: ReviewList[] = Array.isArray(reviewRes) ? reviewRes : reviewRes?.data || [];

            discussions.value = ROLE_ORDER.map((role) => {
                const disc = discussionRes?.find((r) => r.Department?.toLowerCase() === role.toLowerCase() || (role === 'PURC' && r.Department?.toLowerCase() === 'purch'));

                if (disc) {
                    return {
                        id: disc.Id,
                        role,
                        name: disc.ReviewerName ?? '',
                        datetime: disc.CreatedAt ?? '',
                        RecommendationType: disc.RecommendationType ?? '',
                        Reason: disc.Reason ?? '',
                        Remark: disc.Remark ?? '',
                        recommendationItem:
                            disc.recommendation_items?.map((item) => ({
                                BudgetChangeItemId: item.BudgetChangeItemId,
                                ItemCode: item.budget_change_item?.ItemCode ?? '-',
                                OrderedQty: item.budget_change_item?.OrderedQty ?? '',
                                RecommendedQty: item.RecommendedQty ?? '',
                                Uom: item.budget_change_item?.Uom ?? ''
                            })) ?? [],
                        documentUrl: disc.Attachment ? JSON.parse(disc.Attachment) : []
                    } as DiscussionItem;
                }

                const rev = reviews.find((r) => r.ApprovalLevel === role || (role === 'PURC' && r.ApprovalLevel === 'PURCH'));

                if (rev) {
                    return {
                        id: rev.Id,
                        role,
                        name: rev.ReviewerName ?? '',
                        datetime: rev.CreatedAt ?? '',
                        RecommendationType: rev.ReviewType ?? '',
                        Reason: '',
                        Remark: rev.Remark ?? '',
                        recommendationItem:
                            rev.review_items?.map((item) => ({
                                BudgetChangeItemId: item.BudgetChangeItemId,
                                ItemCode: item.budget_change_item?.ItemCode ?? '-',
                                OrderedQty: item.budget_change_item?.OrderedQty ?? '',
                                RecommendedQty: item.budget_change_item?.NewOrder ?? '',
                                Uom: item.budget_change_item?.Uom ?? '',
                                NewOrder: item.budget_change_item?.NewOrder ?? '',
                                Description: item.budget_change_item?.Description ?? ''
                            })) ?? [],
                        documentUrl: []
                    } as DiscussionItem;
                }

                return {
                    id: null,
                    role,
                    name: '',
                    datetime: '',
                    RecommendationType: '',
                    Reason: '',
                    Remark: '',
                    recommendationItem: [],
                    documentUrl: []
                } as DiscussionItem;
            });
        };

        const init = async () => {
            await fetchCombinedDiscussion();

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            currentUserRole.value = user?.user_project_role_code || null;

            const bcrId = Number(route.params.budgetChangeRequestId);

            if (!currentUserRole.value || !ROLE_ORDER.includes(currentUserRole.value)) {
                canRecommend.value = false;
            } else if (CREATOR_ROLES.includes(currentUserRole.value)) {
                canRecommend.value = await budgetChangeRequestService.checkingUserCanCreateRecommendation(bcrId);
            } else {
                canRecommend.value = await budgetChangeRequestService.checkingUserCanReviewRecommendation(bcrId);

                // Manual override for PURC if backend does not return true
                if (currentUserRole.value === 'PURC' && !canRecommend.value) {
                    const mgmIndex = ROLE_ORDER.indexOf('MGM');
                    const purcIndex = ROLE_ORDER.indexOf('PURC');

                    if (discussions.value[mgmIndex].RecommendationType && !discussions.value[purcIndex].RecommendationType) {
                        canRecommend.value = true;
                    }
                }
            }
        };

        onMounted(init);

        const isPreStepsCompleted = () => {
            for (let i = 0; i < 3; i++) {
                if (!discussions.value[i].id) return false;
            }
            return true;
        };

        const getCurrentPrePendingIndex = () => {
            for (let i = 0; i < 3; i++) {
                if (!discussions.value[i].RecommendationType) return i;
            }
            return -1;
        };
        const isFinalStepCompleted = () => {
            const purcIndex = ROLE_ORDER.indexOf('PURC');
            return !!discussions.value[purcIndex].RecommendationType;
        };

        const getStepStatusText = (item: DiscussionItem, index: number) => {
            if (item.RecommendationType) {
                if (item.RecommendationType === 'Acknowledge') return 'Acknowledged';
                return item.RecommendationType;
            }

            if (index < 3) {
                const pendingIndex = getCurrentPrePendingIndex();
                if (index === pendingIndex) return 'Pending';
                return 'Waiting';
            }

            if (!isPreStepsCompleted()) {
                return 'Waiting';
            }

            const pdIndex = ROLE_ORDER.indexOf('PD');
            const mgmIndex = ROLE_ORDER.indexOf('MGM');
            const purcIndex = ROLE_ORDER.indexOf('PURC');

            if (index === pdIndex) return 'Pending';
            if (index === mgmIndex) return discussions.value[pdIndex].RecommendationType ? 'Pending' : 'Waiting';
            if (index === purcIndex) return discussions.value[mgmIndex].RecommendationType ? 'Pending' : 'Waiting';

            return 'Waiting';
        };

        const getStepStatus = (item: DiscussionItem, index: number): 'completed' | 'rejected' | 'pending' | 'waiting' => {
            if (item.RecommendationType === 'Reject') return 'rejected';
            if (item.RecommendationType) return 'completed';

            if (index < 3) {
                const pendingIndex = getCurrentPrePendingIndex();
                if (index === pendingIndex) return 'pending';
                return 'waiting';
            }

            if (!isPreStepsCompleted()) {
                return 'waiting';
            }

            const pdIndex = ROLE_ORDER.indexOf('PD');
            const mgmIndex = ROLE_ORDER.indexOf('MGM');
            const purcIndex = ROLE_ORDER.indexOf('PURC');

            if (index === pdIndex) return 'pending';
            if (index === mgmIndex) return discussions.value[pdIndex].RecommendationType ? 'pending' : 'waiting';
            if (index === purcIndex) return discussions.value[mgmIndex].RecommendationType ? 'pending' : 'waiting';

            return 'waiting';
        };

        // ProButton: primary | secondary | plain | danger | ghost | warning
        const getButtonVariant = (item: DiscussionItem, index: number) => {
            const status = getStepStatus(item, index);

            if (status === 'rejected') return 'danger';
            if (status === 'completed') return 'primary';
            if (status === 'pending') return 'warning';
            return 'secondary';
        };

        // ProTag: secondary | success | info | warn | error | attention
        const getTagVariant = (item: DiscussionItem, index: number) => {
            const status = getStepStatus(item, index);
            if (status === 'rejected') return 'error';
            if (status === 'completed') return 'success';
            if (status === 'pending') return 'warn';
            return 'secondary';
        };

        const getStepIcon = (item: DiscussionItem) => {
            if (item.RecommendationType === 'Reject') return markRaw(PhXCircle);
            if (item.RecommendationType) return markRaw(PhCheckCircle);
            return markRaw(PhWarningCircle);
        };
        const getStepLabel = (item: DiscussionItem) => item.role;

        const togglePanel = (index: number) => {
            const key = String(index);
            active.value = active.value.includes(key) ? active.value.filter((v) => v !== key) : [...active.value, key];
        };

        const openEditModal = (item: DiscussionItem) => {
            editingItem.value = item;
            editComment.value = true;
        };

        const openFile = (url: string) => {
            window.open(url, '_blank');
        };

        function previewAttachment(file: File | AttachmentItem) {
            if (!(file instanceof File)) {
                budgetChangeRequestService.previewAttachment(file);
            }
        }

        const canEditItem = (item: DiscussionItem) => {
            if (!props.editMode) return false;
            if (!item || !item.id) return false;
            if (!currentUserRole.value) return false;
            if (!CREATOR_ROLES.includes(currentUserRole.value)) return false;
            if (currentUserRole.value !== item.role) return false;
            return true;
        };

        const handleAcknowledge = async () => {
            if (currentUserRole.value === 'PURC') {
                const bcrId = Number(route.params.budgetChangeRequestId);

                try {
                    await store.rolesReviewRecommendation(bcrId, {
                        ReviewType: 'Acknowledge'
                    });

                    showToastMsg('success', 'Budget Change Request acknowledged by PURC');

                    await init(); // Refresh lists
                } catch (error) {
                    showToastMsg('error', 'Failed to submit acknowledgement');
                }
            } else {
                createComment.value = true;
            }
        };

        return {
            showApprovalFlow,
            active,
            discussions,
            createComment,
            editComment,
            editingItem,
            canRecommend,
            canEditItem,
            formatDate,
            getStepLabel,
            getStepIcon,
            getButtonVariant,
            getTagVariant,
            getStepStatusText,
            togglePanel,
            openEditModal,
            openFile,
            init,
            previewAttachment,
            currentUserRole,
            handleAcknowledge,
            toastState
        };
    }
});
