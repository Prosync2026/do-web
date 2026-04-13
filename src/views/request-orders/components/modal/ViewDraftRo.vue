<script lang="ts" src="./ViewDraftRo.script"></script>

<template>
    <Toast />

    <Dialog v-model:visible="localVisible" modal header="Draft Request Orders" class="w-11/12 md:w-5/6" @update:visible="handleClose">
        <div class="mb-4">
            <p class="text-gray-600">Continue editing saved draft request orders or delete unused drafts.</p>
        </div>

        <!-- Search Bar -->
        <div class="mb-4">
            <span class="p-input-icon-left w-full">
                <InputText v-model="searchQuery" placeholder="Search by draft ID, requester, project, or budget type..." class="w-full" />
            </span>
        </div>

        <!-- Drafts Table -->
        <DataTable :value="filteredDrafts" :paginator="filteredDrafts.length > 5" :rows="5" class="mb-4" emptyMessage="No draft request orders found">
            <Column field="draftId" header="Draft ID" sortable style="min-width: 180px">
                <template #body="{ data }">
                    <span class="font-medium">{{ data.draftId }}</span>
                </template>
            </Column>

            <Column field="project" header="Project" sortable style="min-width: 100px">
                <template #body="{ data }">
                    <span>{{ data.project }}</span>
                </template>
            </Column>

            <Column field="budgetType" header="Budget Type" sortable style="min-width: 130px">
                <template #body="{ data }">
                    <Badge :value="data.budgetType" :severity="data.budgetType === 'Budgeted' ? 'success' : 'warning'" />
                </template>
            </Column>

            <Column field="requestedBy" header="Requested By" sortable style="min-width: 140px">
                <template #body="{ data }">
                    <span>{{ data.requestedBy }}</span>
                </template>
            </Column>

            <Column field="itemsCount" header="Items" style="min-width: 80px; text-align: center">
                <template #body="{ data }">
                    <div class="flex items-center justify-center gap-1">
                        <i class="pi pi-box text-gray-500"></i>
                        <span>{{ data.itemsCount }}</span>
                    </div>
                </template>
            </Column>

            <Column field="lastModified" header="Last Modified" sortable style="min-width: 140px">
                <template #body="{ data }">
                    <div class="flex items-center gap-1">
                        <i class="pi pi-calendar text-gray-500"></i>
                        <span>{{ formatDate(data.lastModified) }}</span>
                    </div>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 180px">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button label="Continue" icon="pi pi-pencil" size="small" outlined @click="handleContinue(data)" />
                        <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="handleDelete(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <template #footer>
            <div class="flex justify-end">
                <Button label="Close" severity="secondary" outlined icon="pi pi-times" @click="handleClose" />
            </div>
        </template>
    </Dialog>
</template>
