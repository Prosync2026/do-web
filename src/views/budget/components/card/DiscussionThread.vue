<script src="./DiscussionThread.script.ts"></script>

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
                            <Tag :value="getStepStatusText(item, index)" :severity="getStepSeverity(item, index)" style="font-size: 0.75rem; height: 1.3rem" />
                        </div>
                    </AccordionHeader>

                    <AccordionContent>
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
                                    <Badge v-for="(file, idx) in item.documentUrl" :key="idx" :value="file.filename || `File ${idx + 1}`" severity="primary" class="cursor-pointer" @click="openFile(file.path)" />
                                </div>
                            </div>

                            <!-- ✅ Edit button controlled by role -->
                            <Button v-if="canEditItem(item)" icon="pi pi-pencil" text rounded @click="openEditModal(item)" />
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
