<script lang="ts" src="./CreateStockItem.script.ts"></script>

<template>
    <Dialog v-model:visible="visible" modal header="Add Items from Stock" style="width: 90vw; max-width: 1200px" @hide="closeModal">
        <!-- Search -->
        <div class="flex gap-3 mb-4">
            <InputText v-model="searchTerm" placeholder="Search item code or name" class="w-full" />
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-3 gap-4 mb-4">
            <Dropdown v-model="selectedCategory" placeholder="Category" class="w-full" />
            <Dropdown v-model="selectedElement" placeholder="Element" class="w-full" />
            <Dropdown v-model="selectedItemType" placeholder="Item Type" class="w-full" />
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
                <Tag :value="data.itemType" />
            </template>
        </ReusableTable>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-between items-center">
                <span>{{ selectedItems.length }} selected</span>
                <div class="flex gap-2">
                    <Button label="Cancel" outlined @click="closeModal" />
                    <Button label="Add Selected Items" @click="addSelectedItems" :disabled="!selectedItems.length" />
                </div>
            </div>
        </template>
    </Dialog>
</template>
