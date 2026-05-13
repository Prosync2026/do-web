<script lang="ts" src="./CreateRo.script.ts"></script>

<template>
    <Teleport to="body">
        <ProModal :modelValue="localVisible" @update:modelValue="(val: boolean) => { localVisible = val; $emit('update:visible', val); }" title="Add Bulk Items from Budget" size="full" class="create-ro-modal !z-[1000]">
        <p class="text-sm text-gray-500 mb-6">
            Select multiple items from your project budget to add to your request order.
        </p>

        <!-- Search and Filters -->
        <div class="mb-4">
            <!-- Search Bar -->
            <div class="flex gap-4 mb-4 items-center">
                <div class="flex-1">
                    <ProInput v-model="searchTerm" placeholder="Search by ItemCode, Category, Element, Description..."  ><template #icon><PhMagnifyingGlass /></template></ProInput>
                </div>
                <!-- Need wrapper for fixed width if possible, but gap-4 handles it -->
                <ProButton variant="secondary"  @click="clearFilters" :disabled="!hasActiveFilters"><template #icon><PhX /></template>Clear Filters</ProButton>
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
            <div v-if="loading" class="text-blue-600"><PhSpinner :size="18" class="mr-2 animate-spin"  />Loading...</div>
        </div>
        
        <!-- Validation Error Message -->
        <div v-if="showValidation && selectedItems.length === 0" class="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md mb-4 text-sm font-medium">
            <PhXCircle :size="18"  /> At least one item must be selected
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
        <div class="border border-border-border rounded-lg overflow-hidden relative hidden lg:block">
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

        <!-- Mobile View -->
        <div class="block lg:hidden">
            <template v-if="paginatedItems.length > 0">
                <!-- Mobile Select All and Pagination Header -->
                <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 shadow-sm">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            :checked="allSelected" 
                            @change="toggleSelectAllMobile" 
                            class="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                        />
                        <span class="text-sm font-medium text-gray-700">Select All on Page</span>
                    </label>

                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500">Rows:</span>
                        <select 
                            :value="pagination.pageSize" 
                            @change="onPageSizeChange"
                            class="text-sm border-gray-300 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary py-1 pl-2 pr-6 bg-white"
                        >
                            <option v-for="opt in [10, 20, 50, 100]" :key="opt" :value="opt">{{ opt }}</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <ProCard v-for="(item, index) in paginatedItems" :key="item.id" class="shadow-sm border border-gray-100 relative overflow-visible cursor-pointer" :class="isSelected(item) ? 'bg-brand-primary/5 border-brand-primary/20' : ''" @click="toggleSelection(item)">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-start gap-2">
                                <input 
                                    type="checkbox" 
                                    :checked="isSelected(item)" 
                                    @change="toggleSelection(item)" 
                                    @click.stop 
                                    class="mt-1 w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                />
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Item Code</span>
                                    <span class="font-semibold text-text-heading leading-tight">{{ item.itemCode }}</span>
                                </div>
                            </div>
                            <ProTag :variant="getItemTypeSeverity(item.itemType || '')">
                                {{ item.itemType || 'N/A' }}
                            </ProTag>
                        </div>
                        
                        <div class="grid gap-2 mb-2">
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-medium text-gray-500">Description</span>
                                <span class="text-sm font-medium">{{ item.description }}</span>
                            </div>
                            <div class="flex flex-col gap-1" v-if="item.description2">
                                <span class="text-xs font-medium text-gray-500">Description 2</span>
                                <span class="text-sm">{{ item.description2 }}</span>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mt-2 border-t border-gray-100 pt-3">
                                <div class="flex flex-col gap-1">
                                    <span class="text-xs font-medium text-gray-500">Category</span>
                                    <span class="text-sm">{{ item.category }}</span>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <span class="text-xs font-medium text-gray-500">Element</span>
                                    <span class="text-sm">{{ item.element || '-' }}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-3 gap-2 mt-2 border-t border-gray-100 pt-3">
                                <div class="flex flex-col gap-1">
                                    <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Budget Qty</span>
                                    <span class="text-sm font-medium">{{ item.budgetQty || '-' }}</span>
                                </div>
                                <div class="flex flex-col gap-1 border-l border-gray-100 pl-2">
                                    <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Ordered Qty</span>
                                    <span class="text-sm font-medium">{{ item.qtyOrdered || '-' }}</span>
                                </div>
                                <div class="flex flex-col gap-1 border-l border-gray-100 pl-2">
                                    <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Balance Qty</span>
                                    <span class="text-sm font-semibold text-brand-primary">{{ item.balanceQty || '-' }}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mt-2 border-t border-gray-100 pt-3">
                                <div class="flex flex-col gap-1">
                                    <span class="text-xs font-medium text-gray-500">Rate (RM)</span>
                                    <span class="text-sm font-medium">{{ Number(item.rate || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 }) }}</span>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <span class="text-xs font-medium text-gray-500">Amount (RM)</span>
                                    <span class="text-sm font-semibold text-text-heading">{{ Number(item.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 }) }}</span>
                                </div>
                            </div>
                        </div>
                    </ProCard>
                </div>
                
                <div class="mt-4 flex justify-center">
                    <ProButton 
                        v-if="pagination.page > 1" 
                        variant="secondary" 
                        size="sm" 
                        class="mr-2" 
                        @click="handlePageChange({ page: pagination.page - 1, pageSize: pagination.pageSize })"
                    >
                        Previous
                    </ProButton>
                    <span class="text-sm text-gray-500 my-auto mx-2">Page {{ pagination.page }}</span>
                    <ProButton 
                        v-if="paginatedItems.length === pagination.pageSize" 
                        variant="secondary" 
                        size="sm" 
                        class="ml-2" 
                        @click="handlePageChange({ page: pagination.page + 1, pageSize: pagination.pageSize })"
                    >
                        Next
                    </ProButton>
                </div>
            </template>
            <div v-else class="flex flex-col items-center justify-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                <span class="text-sm text-gray-500">No budget items found.</span>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex flex-col gap-4 w-full">
                <!-- Actions -->
                <div class="flex items-center justify-between mt-2 pt-4 border-t border-gray-200">
                    <div class="text-sm text-gray-600 font-medium">{{ selectedItems.length }} item(s) selected</div>

                    <div class="flex gap-3">
                        <ProButton variant="secondary"  @click="closeModal"><template #icon><PhX /></template>Cancel</ProButton>
                        <ProButton variant="primary"  @click="addSelectedItems"><template #icon><PhCheck /></template>Add Items ({{ selectedItems.length }})</ProButton>
                    </div>
                </div>
            </div>
        </template>
    </ProModal>
    </Teleport>
</template>



