<script lang="ts" src="./ViewDraftRo.script.ts"></script>

<template>
    <Toast />

    <ProModal :modelValue="localVisible" @update:modelValue="(val: boolean) => { localVisible = val; if (!val) handleClose(); }" title="Draft Request Orders" size="full" class="!z-[100]">
        <div class="mb-4">
            <p class="text-gray-600">Continue editing saved draft request orders or delete unused drafts.</p>
        </div>

        <!-- Search Bar -->
        <div class="mb-4">
            <ProInput v-model="searchQuery" placeholder="Search by draft ID, requester, project, or budget type..." icon="pi pi-search" class="w-full" />
        </div>

        <!-- Drafts Table -->
        <div class="border border-border-border rounded-lg overflow-hidden">
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
                        <i class="pi pi-box text-gray-500"></i>
                        <span>{{ row.itemsCount }}</span>
                    </div>
                </template>

                <template #cell-lastModified="{ row }">
                    <div class="flex items-center gap-1">
                        <i class="pi pi-calendar text-gray-500"></i>
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
