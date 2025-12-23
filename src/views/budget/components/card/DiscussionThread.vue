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

                <Button icon="pi pi-plus" label="Add Comment" class="h-8" v-if="canRecommend" @click="createComment = true" />
            </div>

            <!-- ================= Accordion ================= -->
            <Accordion v-model:value="active" multiple>
                <AccordionPanel v-for="(item, index) in discussions" :key="index" :value="String(index)">
                    <AccordionHeader>
                        <div class="flex items-center gap-2 w-full">
                            <span class="font-semibold"> {{ item.role }} : {{ item.name }} </span>
                            <Badge :value="getStepStatusText(item, index)" :severity="getStepSeverity(item, index)" style="font-size: 0.65rem; height: 1rem" />
                        </div>
                    </AccordionHeader>

                    <AccordionContent>
                        <div v-if="item.id !== null" class="flex justify-between gap-4">
                            <div class="w-full">
                                <p class="text-xs text-gray-400">
                                    {{ formatDate(item.datetime) }}
                                </p>

                                <p class="text-sm font-semibold mt-1">
                                    Selection:
                                    <span class="font-normal">
                                        {{ item.selectionType || 'Not specified' }}
                                    </span>
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

                                <p class="text-sm mt-2">
                                    <strong>Remark:</strong>
                                    {{ item.message || 'No comments.' }}
                                </p>

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
        </div>

        <!-- ================= Modals ================= -->
        <editcommentBCRModal v-model:visible="createComment" @submit="init" />
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

import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { DiscussionItem } from '@/types/budgetChangeRequest.type';
import { formatDate } from '@/utils/dateHelper';
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
        editcommentBCRModal
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
        const discussions = ref<DiscussionItem[]>([]);
        const createComment = ref(false);
        const editComment = ref(false);
        const editingItem = ref<DiscussionItem | null>(null);
        const canRecommend = ref(true);

        const ROLE_ORDER = ['QS', 'CM', 'PM', 'PD', 'MNGM'];

        const normalizeDepartment = (dept?: string) => {
            if (!dept) return '';
            const d = dept.toLowerCase();
            if (d.includes('site') || d.includes('pm')) return 'PM';
            if (d.includes('qs')) return 'QS';
            if (d.includes('cm')) return 'CM';
            if (d.includes('director') || d.includes('pd')) return 'PD';
            if (d.includes('mngm')) return 'MNGM';
            return dept;
        };

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
                          quantity: Number(found.SpecificQuantity),
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

        const init = async () => {
            await fetchDiscussion();
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
