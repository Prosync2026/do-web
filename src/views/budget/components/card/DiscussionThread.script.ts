import { defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Badge from 'primevue/badge';
import Button from 'primevue/button';

import { budgetChangeRequestService } from '@/services/budgetChangeRequest.service';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { DiscussionItem, ReviewList } from '@/types/budgetChangeRequest.type';
import { formatDate } from '@/utils/dateHelper';
import commentBCRModal from '@/views/budget/components/dialog/CommentBCR.vue';
import editcommentBCRModal from '@/views/budget/components/dialog/EditCommentBCR.vue';

export default defineComponent({
    name: 'DiscussionThread',
    components: {
        Accordion,
        AccordionPanel,
        AccordionHeader,
        AccordionContent,
        Button,
        Badge,
        editcommentBCRModal,
        commentBCRModal
    },
    props: {
        editMode: {
            type: Boolean,
            default: true
        }
    },
    setup(props) {
        const route = useRoute();
        const store = useBudgetChangeRequestStore();

        const showApprovalFlow = ref(true);
        const active = ref<string[]>([]);

        const createComment = ref(false);
        const editComment = ref(false);
        const editingItem = ref<DiscussionItem | null>(null);
        const canRecommend = ref(true);

        const discussions = ref<DiscussionItem[]>([]);
        const currentUserRole = ref<string | null>(null);

        const ROLE_ORDER = ['QS', 'CM', 'SITE', 'PD', 'MGM'];
        const CREATOR_ROLES = ['QS', 'SITE'];

        const fetchCombinedDiscussion = async () => {
            const bcrId = Number(route.params.budgetChangeRequestId);

            const discussionRes = await store.fetchRecommendationList(bcrId);
            const reviewRes = await budgetChangeRequestService.fetchReviewList(bcrId);

            const reviews: ReviewList[] = Array.isArray(reviewRes) ? reviewRes : reviewRes?.data || [];

            discussions.value = ROLE_ORDER.map((role) => {
                const disc = discussionRes?.find((r) => r.Department?.toLowerCase() === role.toLowerCase());

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

                const rev = reviews.find((r) => r.ApprovalLevel === role);
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
            const pdIndex = ROLE_ORDER.indexOf('PD');
            const mgmIndex = ROLE_ORDER.indexOf('MGM');
            return !!(discussions.value[pdIndex].RecommendationType || discussions.value[mgmIndex].RecommendationType);
        };

        const getStepStatusText = (item: DiscussionItem, index: number) => {
            if (item.RecommendationType) return item.RecommendationType;

            if (index < 3) {
                const pendingIndex = getCurrentPrePendingIndex();
                if (index === pendingIndex) return 'Pending';
                return 'Waiting';
            }

            if (!isPreStepsCompleted()) {
                return 'Waiting';
            }

            if (!isFinalStepCompleted()) {
                return 'Pending';
            }

            return 'Waiting';
        };

        const getStepSeverity = (item: DiscussionItem, index: number) => {
            if (item.RecommendationType === 'Reject') return 'danger';
            if (item.RecommendationType) return 'success';

            if (index < 3) {
                const pendingIndex = getCurrentPrePendingIndex();
                if (index === pendingIndex) return 'warn';
                return 'secondary';
            }

            if (!isPreStepsCompleted()) {
                return 'secondary';
            }

            if (!isFinalStepCompleted()) {
                return 'warn';
            }

            return 'secondary';
        };

        const getStepIcon = (item: DiscussionItem) => (item.id ? 'pi pi-check-circle' : 'pi pi-clock');
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
            getStepSeverity,
            getStepStatusText,
            togglePanel,
            openEditModal,
            openFile,
            init,
            previewAttachment
        };
    }
});
