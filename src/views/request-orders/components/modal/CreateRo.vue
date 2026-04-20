<script lang="ts" src="./CreateRo.script.ts"></script>

<template>
    <Teleport to="body">
        <ProModal :modelValue="localVisible" @update:modelValue="(val: boolean) => { localVisible = val; $emit('update:visible', val); }" title="Add Bulk Items from Budget" size="full" class="create-ro-modal !z-[110]">
        <p class="text-sm text-gray-500 mb-6">
            Select multiple items from your project budget to add to your request order.
        </p>

        <!-- Search and Filters -->
        <div class="mb-4">
            <!-- Search Bar -->
            <div class="flex gap-4 mb-4 items-center">
                <div class="flex-1">
                    <ProInput v-model="searchTerm" placeholder="Search by ItemCode, Category, Element, Description..." icon="pi pi-search" />
                </div>
                <!-- Need wrapper for fixed width if possible, but gap-4 handles it -->
                <ProButton variant="secondary" icon="pi pi-times" @click="clearFilters" :disabled="!hasActiveFilters">Clear Filters</ProButton>
            </div>

            <!-- Filter Dropdowns -->
            <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                    <label class="block text-xs font-semibold mb-1 text-gray-700">Element</label>
                    <ProSelect v-model="selectedElement" :options="elementOptions" placeholder="All" />
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-gray-700">Sub Element</label>
                    <div @click="onSubElementClick">
                        <ProSelect v-model="selectedSubElement" :options="subElementOptions" placeholder="All" />
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-gray-700">Sub Sub Element</label>
                    <div @click="onSubSubElementClick">
                        <ProSelect v-model="selectedSubSubElement" :options="subSubElementOptions" placeholder="All" />
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-gray-700">Location 1</label>
                    <ProSelect v-model="selectedLocation1" :options="location1Options" placeholder="All" />
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-gray-700">Location 2</label>
                    <div @click="onLocation2Click">
                        <ProSelect v-model="selectedLocation2" :options="location2Options" placeholder="All" />
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-gray-700">Status</label>
                    <ProSelect v-model="selectedStatus" :options="statusOptions" placeholder="All" />
                </div>
            </div>
        </div>

        <!-- Results Summary -->
        <div class="mb-2 flex justify-between items-center text-sm">
            <div class="text-gray-600">
                <span v-if="hasActiveFilters" class="font-semibold">{{ allBudgetItems?.length || 0 }}</span>
                <span v-else>{{ pagination?.total || 0 }} total</span>
                items available
            </div>
            <div v-if="loading" class="text-blue-600"><i class="pi pi-spinner pi-spin mr-2"></i>Loading...</div>
        </div>
        
        <!-- Validation Error Message -->
        <div v-if="showValidation && selectedItems.length === 0" class="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md mb-4 text-sm font-medium">
            <i class="pi pi-times-circle"></i> At least one item must be selected
        </div>

        <!-- Delivery Date -->
        <div class="mb-4 flex flex-col gap-1" v-if="!unRequiredDelivery">
            <div class="flex items-center gap-3 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                <label class="text-sm font-semibold w-32"> Delivery Date </label>
                <div class="w-60 relative">
                    <ProDatePicker v-model="deliveryDate" placeholder="Select delivery date" appendTo="body" />
                </div>
                <span class="text-xs text-gray-500"> (Applied to selected items) </span>
            </div>
        </div>

        <!-- Table -->
        <div class="border border-border-border rounded-lg overflow-hidden relative">
            <ProTable
                :data="paginatedItems"
                :columns="columns"
                selectable
                :loading="loading"
                :pagination="pagination"
                @update:pagination="handlePageChange"
                @select="handleSelect"
                @select-all="handleSelectAll"
                emptyTitle="No Items Found"
                emptyDescription=""
            >
                <template #cell-rateSlot="{ row }">
                    RM {{ Number(row.rate || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 }) }}
                </template>

                <template #cell-amountSlot="{ row }">
                    RM {{ Number(row.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 }) }}
                </template>
            </ProTable>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex flex-col gap-4 w-full">
                <!-- Actions -->
                <div class="flex items-center justify-between mt-2 pt-4 border-t border-gray-200">
                    <div class="text-sm text-gray-600 font-medium">{{ selectedItems.length }} item(s) selected</div>

                    <div class="flex gap-3">
                        <ProButton variant="secondary" icon="pi pi-times" @click="closeModal">Cancel</ProButton>
                        <ProButton variant="primary" icon="pi pi-check" @click="addSelectedItems">Add Items ({{ selectedItems.length }})</ProButton>
                    </div>
                </div>
            </div>
        </template>
    </ProModal>
    </Teleport>
</template>



