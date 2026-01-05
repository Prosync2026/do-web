<template>
    <div class="card p-4 mb-6 shadow">
        <!-- ================= Header ================= -->
        <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold flex items-center gap-2">
                <i class="pi pi-sitemap"></i>
                Approval Flow
            </h3>

            <Button :icon="showApprovalFlow ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" :label="showApprovalFlow ? 'Hide' : 'Show'" text size="small" @click="showApprovalFlow = !showApprovalFlow" />
        </div>

        <!-- ================= Approval Content ================= -->
        <div v-show="showApprovalFlow">
            <!-- ================= Progress Flow ================= -->
            <div class="flex items-center justify-between mb-4 mt-3">
                <div class="flex items-center gap-3 flex-wrap">
                    <template v-for="(item, index) in discussions" :key="index">
                        <Button :label="getStepLabel(item)" :icon="getStepIcon(item)" class="h-8 px-3 text-xs" rounded :severity="getStepSeverity(item, index)" :outlined="!active.includes(String(index))" @click="togglePanel(index)" />
                        <i v-if="index < discussions.length - 1" class="pi pi-angle-right text-gray-400" />
                    </template>
                </div>
                <!---CHECK ACCESS PERMISSION -->
                <Button icon="pi pi-plus" label="Add Comment" class="h-8" v-if="canRecommend" @click="createComment = true" />
            </div>

            <!-- ================= Accordion ================= -->
            <Accordion v-model:value="active" multiple>
                <AccordionPanel v-for="(item, index) in discussions" :key="index" :value="String(index)">
                    <AccordionHeader>
                        <div class="flex items-center gap-2 w-full">
                            <span class="font-bold">{{ item.role }} : {{ item.name }} </span>
                            <Badge :value="getStepStatusText(item, index)" :severity="getStepSeverity(item, index)" style="font-size: 0.75rem; height: 1.3rem" />
                        </div>
                    </AccordionHeader>

                    <AccordionContent>
                        <div v-if="item.id !== null" class="flex justify-between gap-4">
                            <div class="w-full">
                                <p class="text-sm text-gray-400">
                                    {{ formatDate(item.datetime) }}
                                </p>

                                <p class="text-base font-semibold mt-1">
                                    Selection:
                                    <span class="font-normal">
                                        {{ item.RecommendationType || 'Not specified' }}
                                    </span>
                                </p>

                                <div v-if="item.recommendationItem.length" class="mt-3">
                                    <table class="min-w-full border border-gray-200 text-base text-left">
                                        <thead class="bg-gray-100">
                                            <tr>
                                                <th class="px-3 py-2 border">Item Code</th>
                                                <th class="px-3 py-2 border">Old Quantity</th>
                                                <th class="px-3 py-2 border">New Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(row, rIndex) in item.recommendationItem" :key="rIndex">
                                                <td class="px-3 py-2 border">
                                                    {{ row.ItemCode }}
                                                </td>
                                                <td class="px-3 py-2 border">
                                                    {{ row.OrderedQty }}
                                                </td>
                                                <td class="px-3 py-2 border">
                                                    {{ row.RecommendedQty }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <p class="text-base mt-2" v-if="item.Reason">
                                    <strong>Reason:</strong>
                                    {{ item.Reason }}
                                </p>

                                <p class="text-base mt-1">
                                    <strong>Remark:</strong>
                                    {{ item.Remark || 'No remarks.' }}
                                </p>

                                <div v-if="item.documentUrl?.length" class="flex flex-wrap gap-2 mt-3">
                                    <Badge v-for="(file, idx) in item.documentUrl" :key="idx" :value="file.filename || `File ${idx + 1}`" severity="primary" class="cursor-pointer" @click="openFile(file.path)" />
                                </div>
                            </div>

                            <Button v-if="editMode && item.id" icon="pi pi-pencil" text rounded @click="openEditModal(item)" />
                        </div>

                        <div v-else class="italic text-gray-500">No any data, waiting review</div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>
        </div>

        <!-- ================= Modals ================= -->
        <commentBCRModal v-model:visible="createComment" @submit="init" />

        <editcommentBCRModal v-if="editingItem" v-model:visible="editComment" :item="editingItem" @submit="init" />
    </div>
</template>

<script lang="ts">
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
    setup() {
        const route = useRoute();
        const store = useBudgetChangeRequestStore();

        const showApprovalFlow = ref(true);
        const active = ref<string[]>([]);

        const createComment = ref(false);
        const editComment = ref(false);
        const editingItem = ref<DiscussionItem | null>(null);
        const canRecommend = ref(true);

        const ROLE_ORDER = ['QS', 'CM', 'Site', 'PD', 'MNGM'];
        const discussions = ref<DiscussionItem[]>([]);

        const fetchCombinedDiscussion = async () => {
            const bcrId = Number(route.params.budgetChangeRequestId);
            const ROLE_ORDER = ['QS', 'CM', 'Site', 'PD', 'MNGM'];

            // API calls
            const discussionRes = await store.fetchRecommendationList(bcrId);
            const reviewRes = await budgetChangeRequestService.fetchReviewList(bcrId);
            console.log('checking discussion res', discussionRes);
            console.log('review res', reviewRes);

            discussions.value = ROLE_ORDER.map((role) => {
                const disc = discussionRes?.find((r) => r.Department === role);
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

                const reviews: ReviewList[] = Array.isArray(reviewRes) ? reviewRes : reviewRes?.data || [];

                const rev = reviews.find((r) => r.ReviewerRole === role);
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
                                ItemCode: '-',
                                OrderedQty: '',
                                RecommendedQty: item.RecommendedQty ?? '',
                                Uom: '',
                                NewOrder: '',
                                Description: ''
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

            console.log('Final Combined Discussions:', discussions.value);
        };

        const init = async () => {
            await fetchCombinedDiscussion();

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const roleCode: string | undefined = user?.user_project_role_code;

            const ROLE_ORDER = ['QS', 'CM', 'Site', 'PD', 'MNGM'];
            const CREATOR_ROLES = ['QS', 'Site'];

            const bcrId = Number(route.params.budgetChangeRequestId);

            if (!roleCode || !ROLE_ORDER.includes(roleCode)) {
                canRecommend.value = false;
            } else if (CREATOR_ROLES.includes(roleCode)) {
                console.log('checking this');
                canRecommend.value = await budgetChangeRequestService.checkingUserCanCreateRecommendation(bcrId);
            } else {
                console.log('checking that');
                canRecommend.value = await budgetChangeRequestService.checkingUserCanReviewRecommendation(bcrId);
            }

            console.log('can recommend', canRecommend.value);
        };

        onMounted(init);

        const firstPendingIndex = () => discussions.value.findIndex((d) => !d.id);

        const getStepStatusText = (item: DiscussionItem, index: number) => {
            if (item.id) return 'Approved';
            if (index === firstPendingIndex()) return 'Pending Approval';
            return 'Waiting';
        };

        const getStepSeverity = (item: DiscussionItem, index: number) => {
            if (item.id) return 'success';
            if (index === firstPendingIndex()) return 'warn';
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

        return {
            showApprovalFlow,
            active,
            discussions,
            createComment,
            editComment,
            editingItem,
            canRecommend,
            formatDate,
            getStepLabel,
            getStepIcon,
            getStepSeverity,
            getStepStatusText,
            togglePanel,
            openEditModal,
            openFile,
            init
        };
    }
});
</script>
