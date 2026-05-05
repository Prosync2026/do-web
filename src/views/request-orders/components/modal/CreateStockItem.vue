<script lang="ts" src="./CreateStockItem.script.ts"></script>

<template>
    <ProModal :modelValue="localVisible" @update:modelValue="(val: boolean) => { localVisible = val; if (!val) closeModal(); }" title="Add Items from Stock" size="full" class="!z-[1000]">
        <!-- Search -->
        <div class="flex gap-3 mb-4">
            <ProInput v-model="searchTerm" placeholder="Search item code or name" class="w-full" />
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-3 gap-4 mb-4">
            <ProSelect v-model="selectedCategory" placeholder="Category" class="w-full" />
            <ProSelect v-model="selectedElement" placeholder="Element" class="w-full" />
            <ProSelect v-model="selectedItemType" placeholder="Item Type" class="w-full" />
        </div>

        <!-- Table -->
        <ReusableTable
            :value="filteredItems"
            dataKey="id"
            :columns="columns"
            selectionMode="checkbox"
            v-model:selection="selectedItems"
            :loading="loading"
            :pagination="pagination"
            :onPageChange="handlePageChange"
            :onPageSizeChange="handlePageSizeChange"
        >
            <template #itemTypeSlot="{ data }">
                <ProTag :value="data.itemType" />
            </template>
        </ReusableTable>

        <!-- Footer -->
        <template #footer>
            <div class="flex flex-col gap-3 w-full mt-4">
                <!-- Delivery Date -->
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-3">
                        <ProInput type="date" v-model="deliveryDate" label="Delivery Date" class="w-60" />
                        <span class="text-xs text-gray-500"> (Applied to selected items) </span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-between items-center">
                    <span>{{ selectedItems.length }} selected</span>
                    <div class="flex gap-2">
                        <ProButton variant="secondary" @click="closeModal">Cancel</ProButton>
                        <ProButton variant="primary" @click="addSelectedItems" :disabled="!selectedItems.length">Add Selected Items</ProButton>
                    </div>
                </div>
            </div>
        </template>
    </ProModal>
</template>
