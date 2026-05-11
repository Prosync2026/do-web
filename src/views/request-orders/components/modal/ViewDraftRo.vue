<script lang="ts" src="./ViewDraftRo.script.ts"></script>

<template>
    
    <ProModal :modelValue="localVisible" @update:modelValue="(val: boolean) => { localVisible = val; if (!val) handleClose(); }" title="Draft Request Orders" size="full" class="!z-[1000]">
        <div class="mb-4">
            <p class="text-gray-600">Continue editing saved draft request orders or delete unused drafts.</p>
        </div>

        <!-- Search Bar -->
        <div class="mb-4">
            <ProInput v-model="searchQuery" placeholder="Search by draft ID, requester, project, or budget type..."  class="w-full" ><template #icon><PhMagnifyingGlass /></template></ProInput>
        </div>

        <!-- Drafts Table -->
        <div class="border border-border-border rounded-lg overflow-hidden hidden lg:block">
            <ProTable 
                :data="filteredDrafts" 
                :columns="columns" 
                :loading="loading"
                emptyTitle="No draft request orders found"
                emptyDescription=""
            >
                <template #cell-rowIndex="{ row }">
                    {{ filteredDrafts.indexOf(row) + 1 }}
                </template>

                <template #cell-draftId="{ row }">
                    <span class="font-medium">{{ row.draftId }}</span>
                </template>

                <template #cell-project="{ row }">
                    <span>{{ row.project }}</span>
                </template>

                <template #cell-budgetType="{ row }">
                    <ProTag :variant="row.budgetType === 'Budgeted' ? 'success' : 'warn'">
                        {{ row.budgetType }}
                    </ProTag>
                </template>

                <template #cell-requestedBy="{ row }">
                    <span>{{ row.requestedBy }}</span>
                </template>

                <template #cell-itemsCount="{ row }">
                    <div class="flex items-center gap-1">
                        <PhPackage :size="18" class="text-gray-500"  />
                        <span>{{ row.itemsCount }}</span>
                    </div>
                </template>

                <template #cell-lastModified="{ row }">
                    <div class="flex items-center gap-1">
                        <PhCalendarBlank :size="18" class="text-gray-500"  />
                        <span>{{ formatDate(row.lastModified) }}</span>
                    </div>
                </template>

                <template #actions="{ row }">
                    <div class="flex gap-2 justify-end">
                        <ProButton variant="primary" @click="handleContinue(row)">
                            <template #iconLeft><PhPencilSimple /></template>
                            Continue
                        </ProButton>
                        <ProButton variant="danger" @click="handleDelete(row)">
                            <template #iconLeft><PhTrash /></template>
                        </ProButton>
                    </div>
                </template>
            </ProTable>
        </div>

        <!-- Mobile View -->
        <div class="block lg:hidden">
            <template v-if="filteredDrafts.length > 0">
                <div class="grid grid-cols-1 gap-4">
                    <ProCard v-for="(row, index) in filteredDrafts" :key="row.draftId" class="shadow-sm relative overflow-visible">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-start gap-2">
                                <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ index + 1 }}</span>
                                <div class="flex flex-col gap-0.5 mt-0.5">
                                    <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Draft ID</span>
                                    <span class="font-semibold text-text-heading leading-tight">{{ row.draftId }}</span>
                                </div>
                            </div>
                            <ProTag :variant="row.budgetType === 'Budgeted' ? 'success' : 'warn'">
                                {{ row.budgetType }}
                            </ProTag>
                        </div>
                        
                        <div class="grid gap-2 mb-4">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500 font-medium">Project</span>
                                <span class="text-right">{{ row.project }}</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500 font-medium">Requested By</span>
                                <span class="text-right">{{ row.requestedBy }}</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500 font-medium">Items Count</span>
                                <span class="text-right flex items-center gap-1"><PhPackage :size="16" class="text-gray-500"/> {{ row.itemsCount }}</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500 font-medium">Last Modified</span>
                                <span class="text-right flex items-center gap-1"><PhCalendarBlank :size="16" class="text-gray-500"/> {{ formatDate(row.lastModified) }}</span>
                            </div>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <ProButton variant="primary" @click="handleContinue(row)" size="sm">
                                <template #iconLeft><PhPencilSimple /></template>
                                Continue
                            </ProButton>
                            <ProButton variant="danger" @click="handleDelete(row)" size="sm">
                                <template #iconLeft><PhTrash /></template>
                            </ProButton>
                        </div>
                    </ProCard>
                </div>
            </template>
            <div v-else class="flex flex-col items-center justify-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                <span class="text-sm text-gray-500">No draft request orders found</span>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3 w-full">
                <ProButton variant="secondary" @click="handleClose">
                    <template #iconLeft><PhX /></template>
                    Close
                </ProButton>
            </div>
        </template>
    </ProModal>
</template>
