<script src="./DiscussionThread.script.ts"></script>

<template>
    <ProCard title="Approval Flow" shadow class="mb-6">
        <template #header>
            <div class="flex items-center justify-between w-full">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                    <i class="pi pi-sitemap"></i>
                    Approval Flow
                </h3>
                <ProButton variant="ghost" size="sm" @click="showApprovalFlow = !showApprovalFlow">{{ showApprovalFlow ? 'Hide' : 'Show' }}</ProButton>
            </div>
        </template>

        <!-- ================= Approval Content ================= -->
        <div v-show="showApprovalFlow">
            <!-- ================= Progress Flow ================= -->
            <div class="flex items-center justify-between mb-4 mt-3">
                <div class="flex items-center gap-3 flex-wrap">
                    <template v-for="(item, index) in discussions" :key="index">
                        <ProButton :variant="getStepSeverity(item, index)" size="sm" :class="{ 'opacity-50': !active.includes(String(index)) }" @click="togglePanel(index)">{{ getStepLabel(item) }}</ProButton>
                        <ProDivider v-if="index < discussions.length - 1" direction="vertical" />
                    </template>
                </div>

                <!---CHECK ACCESS PERMISSION -->
                <ProButton variant="primary" size="sm" v-if="canRecommend" @click="handleAcknowledge">{{ currentUserRole === 'PURC' ? 'Acknowledge' : 'Add Comment' }}</ProButton>
            </div>

            <!-- ================= Collapsible Panels ================= -->
            <div v-for="(item, index) in discussions" :key="index" class="mb-3">
                <div v-show="active.includes(String(index))" class="border rounded-lg overflow-hidden">
                    <div class="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer" @click="togglePanel(index)">
                        <span class="font-bold">{{ item.role }} : {{ item.name }} </span>
                        <ProTag :label="getStepStatusText(item, index)" :variant="getStepSeverity(item, index)" />
                    </div>

                    <div class="p-3">
                        <div v-if="item.id !== null" class="flex justify-between gap-4">
                            <div class="w-full">
                                <p class="text-sm text-gray-400">
                                    {{ formatDate(item.datetime) }}
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

                            <ProButton v-if="canEditItem(item)" variant="ghost" size="sm" @click="openEditModal(item)">Edit</ProButton>
                        </div>

                        <ProEmpty v-else title="No data" description="Waiting for review" />
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
