<template>
    <div class="card p-4 mb-6 shadow">
        <h3 class="text-lg font-semibold flex items-center gap-2"><i class="pi pi-comments"></i> Recommendation</h3>

        <!-- Tabs -->
        <div class="flex items-center justify-between mb-4 mt-3">
            <div class="flex items-center gap-2">
                <Button v-for="(item, index) in discussions" :key="index" @click="active = String(index)" rounded :label="item.role" class="h-8 px-2" :outlined="active !== String(index)" />
            </div>

            <Button icon="pi pi-plus" label="Add Comment" class="h-8" v-if="canRecommend" @click="createComment = true" />
        </div>

        <!-- Accordion -->
        <Accordion v-model:value="active">
            <AccordionPanel v-for="(item, index) in discussions" :key="index" :value="String(index)">
                <AccordionHeader>
                    <div class="flex items-center w-full gap-2">
                        <span class="font-semibold">{{ item.role }}:</span>
                        <span v-if="item.id !== null">{{ item.name }}</span>
                        <Badge v-else value="Waiting" severity="danger" class="ml-1" style="font-size: 0.65rem; height: 1rem" />
                    </div>
                </AccordionHeader>

                <AccordionContent>
                    <div v-if="item.id !== null" class="flex justify-between items-start">
                        <div class="w-full">
                            <span class="text-gray-400 text-sm">{{ formatDate(item.datetime) }}</span>

                            <div class="mt-1 text-gray-700 text-sm font-semibold flex flex-wrap items-center gap-1">
                                <span>Selection:</span>
                                <span>
                                    <template v-if="item.selectionType === 'QS_Recommendation'">Change Budget Qty according to QS recommendation</template>
                                    <template v-else-if="item.selectionType === 'Site_Recommendation'">Change Budget Qty according to Site recommendation</template>
                                    <template v-else-if="item.selectionType === 'Specific_Quantity'">
                                        Change Budget Qty according to Specific Quantity
                                        <span class="font-semibold">(Quantity: {{ item.quantity }})</span>
                                    </template>
                                    <template v-else>Not selected</template>
                                </span>
                            </div>

                            <p class="mt-2 text-sm text-gray-700"><span class="font-semibold">Remark: </span>{{ item.message || 'No comments yet.' }}</p>

                            <div v-if="item.documentUrl?.length" class="mt-4">
                                <div class="flex flex-wrap gap-2 mt-2" style="font-size: 9px !important">
                                    <Badge v-for="(file, idx) in item.documentUrl" :key="idx" :value="file.filename || `File ${idx + 1}`" severity="primary" class="cursor-pointer" @click="openFile(file.path)" />
                                </div>
                            </div>
                        </div>

                        <Button v-if="editMode && item.id" icon="pi pi-pencil" text rounded @click="openEditModal(item)" />
                    </div>

                    <div v-else class="text-gray-500 italic p-2">No discussion yet.</div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>

        <!-- ================= Final Decision ================= -->
        <div v-if="showActionButtons" class="mt-4 p-4 border rounded shadow-sm bg-gray-50">
            <h4 class="font-semibold mb-3 text-gray-700 flex items-center gap-2"><i class="pi pi-briefcase"></i> Final Decision</h4>

            <!-- Selection -->
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-600 mb-1"> Selection </label>
                <Dropdown v-model="finalSelection" :options="finalSelectionOptions" optionLabel="label" optionValue="value" placeholder="Select recommendation type" class="w-full" />
            </div>

            <!-- Remark -->
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-600 mb-1"> Remark </label>
                <Textarea v-model="finalRemark" rows="5" style="resize: none" class="w-full" placeholder="Enter final decision remark..." />
            </div>

            <!-- Actions -->
            <div class="flex gap-2 justify-end">
                <Button label="Approve" icon="pi pi-check" class="p-button-success" :loading="loading" @click="submitFinalDecision('Approved')" />
                <Button label="Reject" icon="pi pi-times" class="p-button-danger" :loading="loading" @click="submitFinalDecision('Rejected')" />
            </div>
        </div>

        <!-- Modals -->
        <commentBCRModal v-model:visible="createComment" @submit="init" />
        <editcommentBCRModal v-if="editingItem" v-model:visible="editComment" :item="editingItem" @submit="init" />
    </div>
</template>

<script lang="ts">
import { budgetChangeRequestService } from '@/services/budgetChangeRequest.service';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRFinalDecisionPayload, DiscussionItem } from '@/types/budgetChangeRequest.type';
import { formatDate } from '@/utils/dateHelper';
import commentBCRModal from '@/views/budget/components/dialog/CommentBCR.vue';
import editcommentBCRModal from '@/views/budget/components/dialog/EditCommentBCR.vue';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import { defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    name: 'DiscussionThread',
    components: {
        commentBCRModal,
        editcommentBCRModal,
        Dropdown,
        Textarea,
        Button,
        Badge,
        Accordion,
        AccordionPanel,
        AccordionHeader,
        AccordionContent
    },
    props: { editMode: { type: Boolean, default: true } },
    setup() {
        const store = useBudgetChangeRequestStore();
        const route = useRoute();

        const active = ref('0');
        const discussions = ref<DiscussionItem[]>([]);
        const createComment = ref(false);
        const editComment = ref(false);
        const editingItem = ref<DiscussionItem | null>(null);

        const canRecommend = ref(false);
        const showActionButtons = ref(false);
        const finalRemark = ref('');
        const finalSelection = ref<string | null>(null);
        const loading = ref(false);

        const finalSelectionOptions = [
            { label: 'QS Recommendation', value: 'QS_Recommendation' },
            { label: 'Site Recommendation', value: 'Site_Recommendation' },
            { label: 'Specific Quantity', value: 'Specific_Quantity' }
        ];

        const ROLE_ORDER = ['QS', 'Purchasing', 'Project Director'];

        const getUser = (): any | null => {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        };

        const getUserDepartment = (): string | null => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            try {
                const user = JSON.parse(userStr);
                return Array.isArray(user.role) ? user.role[0] : user.role;
            } catch {
                return null;
            }
        };

        const fetchDiscussion = async () => {
            const res = await store.fetchRecommendationList(Number(route.params.budgetChangeRequestId));

            const mapped: DiscussionItem[] = (res ?? []).map((item: any) => ({
                id: item.Id ?? null,
                role: item.Department ?? '',
                name: item.ReviewerName ?? '',
                datetime: item.CreatedAt ?? '',
                message: item.Remark ?? '',
                selectionType: item.RecommendationType ?? null,
                quantity: item.Quantity ?? null,
                documentUrl: item.Attachment ? JSON.parse(item.Attachment) : []
            }));

            discussions.value = ROLE_ORDER.map((role) => {
                const found = mapped.find((x) => x.role === role);
                return (
                    found || {
                        id: null,
                        role,
                        name: '-',
                        datetime: '-',
                        message: '',
                        selectionType: '',
                        quantity: null,
                        documentUrl: []
                    }
                );
            });
        };

        const init = async () => {
            await fetchDiscussion();
            const department = getUserDepartment();

            if (department) {
                canRecommend.value = await budgetChangeRequestService.checkingUserCanCreateRecommendation(Number(route.params.budgetChangeRequestId), department);
            }

            const user = getUser();
            showActionButtons.value = user?.access_level && user.access_level.toUpperCase() !== 'USER';
        };

        onMounted(init);

        const openEditModal = (item: DiscussionItem) => {
            editingItem.value = item;
            editComment.value = true;
        };

        const submitFinalDecision = async (status: 'Approved' | 'Rejected') => {
            const user = getUser();
            if (!user) return;

            if (!finalSelection.value) {
                alert('Please select a recommendation type.');
                return;
            }

            loading.value = true;

            const payload: BCRFinalDecisionPayload = {
                ReviewerName: user.name,
                Status: status,
                RecommendationType: finalSelection.value,
                Remark: finalRemark.value
            };

            try {
                await budgetChangeRequestService.createManagementFinalDecisionRecommendation(Number(route.params.budgetChangeRequestId), payload);

                await init();
            } finally {
                loading.value = false;
            }
        };

        const openFile = (url: string) => {
            window.open(url, '_blank');
        };

        return {
            active,
            discussions,
            formatDate,
            createComment,
            editComment,
            editingItem,
            canRecommend,
            showActionButtons,
            finalRemark,
            finalSelection,
            finalSelectionOptions,
            loading,
            openEditModal,
            submitFinalDecision,
            init,
            openFile
        };
    }
});
</script>
