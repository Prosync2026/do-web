<script src="./DiscussionThread.script.ts"></script>

<template>
    <ProCard shadow class="mb-6">
        <template #header>
            <div class="flex items-center justify-between w-full">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                    <PhTreeStructure :size="18"  />
                    Approval Flow
                </h3>
                <ProButton variant="ghost" size="sm" @click="showApprovalFlow = !showApprovalFlow">{{ showApprovalFlow ? 'Hide' : 'Show' }}</ProButton>
            </div>
        </template>

        <!-- ================= Approval Content ================= -->
        <div v-show="showApprovalFlow">
            <!-- ================= Progress Flow ================= -->
            <div class="flex items-center justify-end text-xs text-gray-400 mb-1 md:hidden w-full">
                <span class="italic mr-1">Swipe flow</span>
                <PhArrowsLeftRight :size="14" class="animate-pulse" />
            </div>
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 mt-1">
                <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full" style="scrollbar-width: none; -ms-overflow-style: none;">
                    <template v-for="(item, index) in discussions" :key="index">
                        <ProButton :variant="getButtonVariant(item, index)" size="sm" @click="togglePanel(index)" class="shrink-0">
                            <component :is="getStepIcon(item)" :size="18" class="mr-1" />
                            {{ getStepLabel(item) }}
                        </ProButton>
                        <PhCaretRight :size="16" class="text-gray-400 shrink-0" v-if="index < discussions.length - 1"  />
                    </template>
                </div>

                <!---CHECK ACCESS PERMISSION -->
                <div class="flex shrink-0 justify-end">
                    <ProButton variant="primary" size="sm" v-if="canRecommend" @click="handleAcknowledge" class="w-full sm:w-auto justify-center">{{ currentUserRole === 'PURC' ? 'Acknowledge' : 'Add Comment' }}</ProButton>
                </div>
            </div>

            <!-- ================= Collapsible Panels ================= -->
            <div v-for="(item, index) in discussions" :key="index" class="mb-3">
                <div class="border rounded-lg overflow-hidden">
                    <div class="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer" @click="togglePanel(index)">
                        <span class="font-bold">{{ item.role }} : {{ item.name }} </span>
                        <ProTag :label="getStepStatusText(item, index)" :variant="getTagVariant(item, index)" />
                    </div>

                    <div v-if="item.id !== null" class="pl-3">
                        <div v-if="item.recommendationItem.length">
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
                                        <td class="px-3 py-2 border">{{ row.ItemCode }}</td>
                                        <td class="px-3 py-2 border">{{ row.OrderedQty }}</td>
                                        <td class="px-3 py-2 border">{{ row.RecommendedQty }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p class="text-base mt-2" v-if="item.Reason">
                            <strong>Reason:</strong>
                            {{ item.Reason }}
                        </p>

                        <!-- Collapsible: Date, Remark, Attachments, Edit -->
                        <div v-show="active.includes(String(index))">
                            <div class="flex items-center justify-between mt-2">
                                <p class="text-sm text-gray-400">
                                    {{ formatDate(item.datetime) }}
                                </p>
                                <ProButton v-if="canEditItem(item)" variant="primary" size="sm" @click="openEditModal(item)" class="mr-3">Edit</ProButton>
                            </div>

                            <p class="text-base mt-1">
                                <strong>Remark:</strong>
                                {{ item.Remark || 'No remarks.' }}
                            </p>

                            <div v-if="item.documentUrl?.length" class="flex flex-wrap gap-2 mt-3">
                                <ProTooltip v-for="(file, idx) in item.documentUrl" :key="idx" content="Preview Attachment">
                                    <ProTag :label="file.filename || `File ${idx + 1}`" variant="info" class="cursor-pointer" @click="previewAttachment(file)" />
                                </ProTooltip>
                            </div>
                        </div>
                    </div>

                    <div v-else v-show="active.includes(String(index))">
                        <ProEmpty title="No data" description="Waiting for review" />
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= Modals ================= -->
        <commentBCRModal v-model:visible="createComment" @submit="init" />
        <editcommentBCRModal v-if="editingItem" v-model:visible="editComment" :item="editingItem" @submit="init" />

        <!-- ================= Toast ================= -->
        <ProToast v-model="toastState.visible" :type="toastState.type" :message="toastState.message" :autoDismiss="true" :duration="3000" />
    </ProCard>
</template>
