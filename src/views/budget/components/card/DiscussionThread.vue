<template>
    <div class="card p-4 mb-6 shadow">
        <!-- ================= Header ================= -->
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <i class="pi pi-sitemap"></i>
            Approval Flow
        </h3>

        <!-- ================= Progress Flow ================= -->
        <div class="flex items-center justify-between mb-4 mt-3">
            <div class="flex items-center gap-3 flex-wrap">
                <template v-for="(item, index) in discussions" :key="index">
                    <Button :label="getStepLabel(item)" :icon="getStepIcon(item, index)" class="h-8 px-3 text-xs" rounded :severity="getStepSeverity(item, index)" :outlined="!active.includes(String(index))" @click="togglePanel(index)" />
                    <i v-if="index < discussions.length - 1" class="pi pi-angle-right text-gray-400" />
                </template>
            </div>

            <Button icon="pi pi-plus" label="Add Comment" class="h-8" v-if="canRecommend" @click="createComment = true" />
        </div>

        <!-- ================= Accordion ================= -->
        <Accordion v-model:value="active" multiple>
            <AccordionPanel v-for="(item, index) in discussions" :key="index" :value="String(index)">
                <AccordionHeader>
                    <div class="flex items-center gap-2 w-full">
                        <span class="font-semibold">{{ item.role }} : {{ item.name }}</span>
                        <Badge :value="getStepStatusText(item, index)" :severity="getStepSeverity(item, index)" style="font-size: 0.65rem; height: 1rem" />
                    </div>
                </AccordionHeader>

                <AccordionContent>
                    <div v-if="item.id !== null" class="flex justify-between gap-4">
                        <div class="w-full">
                            <p class="text-xs text-gray-400">{{ formatDate(item.datetime) }}</p>
                            <p class="text-sm font-semibold mt-1">
                                Selection: <span class="font-normal">{{ item.selectionType || 'Not specified' }}</span>
                            </p>

                            <div class="mt-3">
                                <table class="min-w-full border border-gray-200 text-sm text-left">
                                    <thead class="bg-gray-100">
                                        <tr>
                                            <th class="px-3 py-2 border">Item Code</th>
                                            <th class="px-3 py-2 border">Old Quantity</th>
                                            <th class="px-3 py-2 border">New Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="px-3 py-2 border">BRC-A11-STD</td>
                                            <td class="px-3 py-2 border">22</td>
                                            <td class="px-3 py-2 border">15</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p class="text-sm mt-2"><strong>Remark:</strong> {{ item.message || 'No comments.' }}</p>

                            <div v-if="item.documentUrl?.length" class="flex flex-wrap gap-2 mt-3">
                                <Badge v-for="(file, idx) in item.documentUrl" :key="idx" :value="file.filename || `File ${idx + 1}`" severity="primary" class="cursor-pointer" @click="openFile(file.path)" />
                            </div>
                        </div>

                        <Button v-if="editMode && item.id" icon="pi pi-pencil" text rounded @click="openEditModal(item)" />
                    </div>

                    <div v-else class="italic text-gray-500">No action taken yet.</div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>

        <!-- ================= Final Decision ================= -->
        <div v-if="canShowFinalDecision" class="mt-6 bg-white p-4 rounded">
            <!-- 標題 -->
            <h4 class="text-lg font-semibold text-gray-800 mb-4">Final Management Decision</h4>

            <!-- Dropdown -->
            <Dropdown v-model="finalSelection" :options="finalSelectionOptions" optionLabel="label" optionValue="value" placeholder="Select recommendation type" class="w-full mb-4" />

            <!-- Specific Quantity Table -->
            <div v-if="finalSelection === 'Specific_Quantity'" class="mt-2">
                <table class="w-full text-sm border border-gray-200 border-collapse">
                    <thead class="text-gray-600 bg-gray-50">
                        <tr>
                            <th class="text-left px-3 py-2 border border-gray-200 font-medium">Item Code</th>
                            <th class="text-left px-3 py-2 border border-gray-200 font-medium">Old Quantity</th>
                            <th class="text-left px-3 py-2 border border-gray-200 font-medium">New Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="px-3 py-2 border border-gray-200">
                                <input type="text" :value="specificItem.itemCode" readonly />
                            </td>
                            <td class="px-3 py-2 border border-gray-200">
                                <input type="number" :value="specificItem.oldQty" readonly />
                            </td>
                            <td class="px-3 py-2 border border-gray-200">
                                <input type="number" class="w-full px-2 py-1 rounded border border-gray-300 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-gray-700" v-model.number="specificItem.newQty" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Remark Textarea -->
            <Textarea v-model="finalRemark" rows="4" class="w-full mt-4 mb-4" placeholder="Enter your remarks..." />

            <!-- Action Buttons -->
            <div class="flex justify-end gap-2">
                <Button label="Approve" icon="pi pi-check" severity="success" :loading="loading" @click="submitFinalDecision('Approved')" />
                <Button label="Reject" icon="pi pi-times" severity="danger" :loading="loading" @click="submitFinalDecision('Rejected')" />
            </div>
        </div>

        <!-- ================= Modals ================= -->
        <commentBCRModal v-model:visible="createComment" @submit="init" />
        <editcommentBCRModal v-if="editingItem" v-model:visible="editComment" :item="editingItem" @submit="init" />
    </div>
</template>

<script lang="ts">
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

import { budgetChangeRequestService } from '@/services/budgetChangeRequest.service';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRFinalDecisionPayload, DiscussionItem } from '@/types/budgetChangeRequest.type';
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
        Dropdown,
        Textarea,
        commentBCRModal,
        editcommentBCRModal
    },
    props: { editMode: { type: Boolean, default: true } },
    setup() {
        const route = useRoute();
        const store = useBudgetChangeRequestStore();

        const active = ref<string[]>([]);
        const discussions = ref<DiscussionItem[]>([]);
        const createComment = ref(false);
        const editComment = ref(false);
        const editingItem = ref<DiscussionItem | null>(null);

        const canRecommend = ref(false);
        const showActionButtons = ref(false);
        const canShowFinalDecision = ref(true);
        const finalSelection = ref<string | null>(null);
        const finalRemark = ref('');
        const loading = ref(false);

        // ================= 新的角色順序 =================
        const ROLE_ORDER = ['QS', 'CM', 'PM', 'PD', 'MNGM'];

        const finalSelectionOptions = [
            { label: 'QS Recommendation', value: 'QS_Recommendation' },
            { label: 'Site Recommendation', value: 'Site_Recommendation' },
            { label: 'Specific Quantity', value: 'Specific_Quantity' }
        ];

        const specificItem = ref({
            itemCode: 'BRC-A11-STD',
            oldQty: 22,
            newQty: null as number | null
        });

        // ================= Helper Functions =================
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

        const getUser = (): any | null => {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        };

        const normalizeDepartment = (dept?: string) => {
            if (!dept) return '';
            const d = dept.toLowerCase();
            if (d.includes('site') || d.includes('pm') || d === 'project manager') return 'SITE';
            if (d.includes('qs')) return 'QS';
            if (d.includes('purchasing')) return 'Purchasing';
            if (d.includes('director')) return 'Project Director';
            if (d.includes('cm')) return 'CM';
            if (d.includes('mngm')) return 'MNGM';
            return dept;
        };

        // ================= Fetch Discussions =================
        const fetchDiscussion = async () => {
            const res = await store.fetchRecommendationList(Number(route.params.budgetChangeRequestId));

            discussions.value = ROLE_ORDER.map((role) => {
                const found = res?.find((r: any) => normalizeDepartment(r.Department) === role);
                return found
                    ? {
                          id: found.Id,
                          role,
                          name: found.ReviewerName,
                          datetime: found.CreatedAt,
                          message: found.Remark,
                          selectionType: found.RecommendationType,
                          quantity: found.Quantity,
                          documentUrl: found.Attachment ? JSON.parse(found.Attachment) : []
                      }
                    : {
                          id: null,
                          role,
                          name: '',
                          datetime: '',
                          message: '',
                          selectionType: '',
                          quantity: null,
                          documentUrl: []
                      };
            });

            active.value = discussions.value.map((_, i) => String(i));
        };

        // ================= Final Decision Authority =================
        // const checkFinalDecisionAuthority = () => {
        //     const mngmItem = discussions.value.find((d) => d.role === 'MNGM');
        //     const pdItem = discussions.value.find((d) => d.role === 'PD');

        //     const userDept = normalizeDepartment(getUserDepartment());

        //     if (!mngmItem?.id && userDept === 'PD') {
        //         // MNGM 沒做，PD 可以做 final decision
        //         canShowFinalDecision.value = true;
        //     } else if (userDept === 'MNGM') {
        //         // MNGM 做 final decision
        //         canShowFinalDecision.value = true;
        //     } else {
        //         canShowFinalDecision.value = false;
        //     }
        // };

        // ================= Init =================
        const init = async () => {
            await fetchDiscussion();

            // 是否可 create recommendation
            const department = normalizeDepartment(getUserDepartment());
            if (department && ROLE_ORDER.includes(department)) {
                canRecommend.value = await budgetChangeRequestService.checkingUserCanCreateRecommendation(Number(route.params.budgetChangeRequestId), department);
            } else {
                canRecommend.value = false;
            }

            // 是否顯示 action buttons
            const user = getUser();
            showActionButtons.value = !!(user?.access_level && user.access_level.toUpperCase() !== 'USER');

            // 檢查 final decision 權限
            checkFinalDecisionAuthority();
        };

        onMounted(init);

        // ================= Step & Accordion Helpers =================
        const firstPendingIndex = () => discussions.value.findIndex((d) => !d.id);

        const getStepStatusText = (item: DiscussionItem, index: number) => {
            if (item.id) return 'Approved';
            if (index === firstPendingIndex()) return 'Pending Approval';
            return 'Waiting';
        };

        const getStepSeverity = (item: DiscussionItem, index: number) => {
            if (item.id) return 'success';
            if (index === firstPendingIndex()) return 'warning';
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

        const openFile = (url: string) => window.open(url, '_blank');

        // ================= Submit Final Decision =================
        const submitFinalDecision = async (status: 'Approved' | 'Rejected') => {
            loading.value = true;

            const payload: BCRFinalDecisionPayload = {
                ReviewerName: getUser()?.name || 'Management',
                Status: status,
                RecommendationType: finalSelection.value!,
                Remark: finalRemark.value
            };

            await budgetChangeRequestService.createManagementFinalDecisionRecommendation(Number(route.params.budgetChangeRequestId), payload);

            await init();
            loading.value = false;
        };

        return {
            active,
            discussions,
            createComment,
            editComment,
            editingItem,
            canRecommend,
            showActionButtons,
            canShowFinalDecision,
            finalSelection,
            finalRemark,
            finalSelectionOptions,
            specificItem,
            loading,
            formatDate,
            getStepLabel,
            getStepIcon,
            getStepSeverity,
            getStepStatusText,
            togglePanel,
            openEditModal,
            openFile,
            submitFinalDecision,
            init
        };
    }
});
</script>
