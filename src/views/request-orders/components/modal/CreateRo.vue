<script lang="ts" src="./CreateRo.script.ts"></script>

<template>
    <Dialog v-model:visible="localVisible" modal :header="modalTitle" :style="{ width: '90vw', maxWidth: '1200px' }" :closable="true" @hide="closeModal" class="create-ro-modal">
        <template #header>
            <div class="flex items-center gap-3">
                <i class="pi pi-box text-xl"></i>
                <div>
                    <h2 class="text-xl font-bold m-0">Add Bulk Items from Budget</h2>
                    <p class="text-sm text-gray-500 m-0">Select multiple items from your project budget to add to your request order.</p>
                </div>
            </div>
        </template>

        <!-- Search and Filters -->
        <div class="mb-4">
            <!-- Search Bar -->
            <div class="flex gap-4 mb-4">
                <div class="flex-1">
                    <div class="p-input-icon-left w-full">
                        <i class="pi pi-search"></i>
                        <InputText v-model="searchTerm" placeholder="Search by ItemCode, Category, Element, Description, Description2" class="w-full" />
                    </div>
                </div>
                <Button label="Clear Filters" icon="pi pi-times" outlined @click="clearFilters" :disabled="!hasActiveFilters" />
            </div>

            <!-- Filter Dropdowns -->
            <div class="grid grid-cols-6 gap-3">
                <!-- <div>
                    <label class="block text-xs font-semibold mb-2 text-gray-700">Category</label>
                    <Dropdown v-model="selectedCategory" :options="categoryOptions" option-label="label" option-value="value" placeholder="All" class="w-full text-sm" :show-clear="true" />
                </div> -->

                <div>
                    <label class="block text-xs font-semibold mb-2 text-gray-700">Element</label>
                    <Dropdown v-model="selectedElement" :options="elementOptions" option-label="label" option-value="value" placeholder="All" class="w-full text-sm" :show-clear="true" />
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-2 text-gray-700">Sub Element</label>
                    <Dropdown v-model="selectedSubElement" :options="subElementOptions" option-label="label" option-value="value" placeholder="All" class="w-full text-sm" :show-clear="true" @focus="onSubElementClick" />
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-2 text-gray-700">Sub Sub Element</label>
                    <Dropdown v-model="selectedSubSubElement" :options="subSubElementOptions" option-label="label" option-value="value" placeholder="All" class="w-full text-sm" :show-clear="true" @focus="onSubSubElementClick" />
                </div>
                <div>
                    <label class="block text-xs font-semibold mb-2 text-gray-700">Location 1</label>
                    <Dropdown v-model="selectedLocation1" :options="location1Options" option-label="label" option-value="value" placeholder="All" class="w-full text-sm" :show-clear="true" />
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-2 text-gray-700">Location 2</label>
                    <Dropdown v-model="selectedLocation2" :options="location2Options" option-label="label" option-value="value" placeholder="All" class="w-full text-sm" :show-clear="true" @focus="onLocation2Click" />
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-2 text-gray-700">Status</label>
                    <Dropdown v-model="selectedStatus" :options="statusOptions" option-label="label" option-value="value" placeholder="All" class="w-full text-sm" :show-clear="true" />
                </div>
            </div>
        </div>

        <!-- Results Summary -->
        <div class="mb-4 flex justify-between items-center">
            <div class="text-sm text-gray-600">
                <span v-if="hasActiveFilters" class="font-semibold">{{ allBudgetItems?.length || 0 }}</span>
                <span v-else>{{ pagination?.total || 0 }} total</span>
                items available
            </div>
            <div v-if="loading" class="text-xs text-blue-600"><i class="pi pi-spinner pi-spin mr-2"></i>Loading...</div>
        </div>
        <Message v-if="showValidation && selectedItems.length === 0" severity="error" icon="pi pi-times-circle"> At least one item must be selected </Message>

        <!-- Table -->
        <div class="relative dark:text-white">
            <DataTable
                v-model:selection="selectedItems"
                :value="paginatedItems"
                dataKey="id"
                class="p-datatable-sm"
                :loading="loading"
                scrollable
                scrollHeight="400px"
            >
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column v-for="col in visibleColumns" :key="col.field" :field="col.field" :header="col.header" :sortable="col.sortable">
                    <template v-if="col.bodySlot" #body="{ data }">
                         <span v-if="col.bodySlot === 'rateSlot'">
                             {{ Number(data.Rate || 0).toLocaleString('en-MY', { style: 'currency', currency: 'MYR' }) }}
                         </span>
                         <span v-else-if="col.bodySlot === 'amountSlot'">
                             {{ Number(data.Amount || 0).toLocaleString('en-MY', { style: 'currency', currency: 'MYR' }) }}
                         </span>
                         <span v-else>
                            {{ data[col.field] }}
                         </span>
                    </template>
                </Column>
            </DataTable>

            <!-- Custom Pagination -->
            <div v-if="pagination" class="flex flex-col sm:flex-row items-center mt-4 px-4 py-3 border-t dark:border-gray-700 w-full">
                <div class="w-full sm:w-1/3 text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
                    Showing {{ displayStart }} – {{ displayEnd }} of {{ pagination.total }}
                </div>

                <div class="w-full sm:w-1/3 flex justify-center items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
                    <Button icon="pi pi-angle-double-left" text :disabled="pagination.page === 1" @click="handlePageChange(1)" title="First Page" />
                    <Button icon="pi pi-angle-left" text :disabled="pagination.page === 1" @click="handlePageChange(pagination.page - 1)" title="Previous Page" />

                    <div class="flex gap-1">
                        <Button
                            v-for="pageNum in getPaginationNumbers()"
                            :key="pageNum"
                            :label="`${pageNum}`"
                            :severity="pageNum === pagination.page ? 'primary' : 'secondary'"
                            :text="pageNum !== pagination.page"
                            @click="handlePageChange(pageNum)"
                            rounded
                            class="w-8 h-8 p-0 flex items-center justify-center text-xs"
                        />
                    </div>

                    <Button icon="pi pi-angle-right" text :disabled="pagination.page >= (pagination.totalPages || 1)" @click="handlePageChange(pagination.page + 1)" title="Next Page" />
                    <Button icon="pi pi-angle-double-right" text :disabled="pagination.page >= (pagination.totalPages || 1)" @click="handlePageChange(pagination.totalPages || 1)" title="Last Page" />
                </div>

                 <div class="w-full sm:w-1/3 flex justify-end mt-2 sm:mt-0 items-center gap-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
                    <Dropdown :modelValue="pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="[10, 25, 50, 100]" class="w-20" />
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex flex-col gap-3 w-full">
                <!-- Delivery Date -->
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-3">
                        <label class="text-sm font-semibold w-32"> Delivery Date <span class="text-red-500">*</span> </label>

                        <Calendar v-model="deliveryDate" dateFormat="dd/mm/yy" showIcon placeholder="Select delivery date" class="w-60" />

                        <span class="text-xs text-gray-500"> (Applied to selected items) </span>
                    </div>

                    <!-- <Message v-if="showValidation && !deliveryDate" severity="error" icon="pi pi-times-circle"> Delivery date is required </Message> -->
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600">{{ selectedItems.length }} item(s) selected</div>

                    <div class="flex gap-3">
                        <Button label="Cancel" icon="pi pi-times" outlined @click="closeModal" />
                        <Button :label="`Add Items (${selectedItems.length})`" icon="pi pi-check" @click="addSelectedItems" />
                    </div>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.create-ro-modal :deep(.p-dialog-header) {
    padding: 1.5rem;
}

.create-ro-modal :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.create-ro-modal :deep(.p-dialog-footer) {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
}

.create-ro-modal :deep(.p-datatable-header) {
    padding: 0;
}

.create-ro-modal :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.75rem;
    font-weight: 600;
    background-color: #f9fafb;
}

.create-ro-modal :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.75rem;
}

.create-ro-modal :deep(.p-datatable-emptymessage > tr > td) {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
}
</style>
