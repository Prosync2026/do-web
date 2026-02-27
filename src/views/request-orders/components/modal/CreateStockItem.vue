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
            <div class="flex flex-col gap-3 w-full">
                <!-- Delivery Date -->
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-3">
                        <label class="text-sm font-semibold w-32"> Delivery Date <span class="text-red-500">*</span> </label>
                        <Calendar v-model="deliveryDate" dateFormat="dd/mm/yy" showIcon placeholder="Select delivery date" class="w-60" />
                        <span class="text-xs text-gray-500"> (Applied to selected items) </span>
                    </div>
                    <Message v-if="showValidation && !deliveryDate" severity="error" icon="pi pi-times-circle">
                        Delivery date is required
                    </Message>
                </div>

                <!-- Actions -->
                <div class="flex justify-between items-center">
                    <span>{{ selectedItems.length }} selected</span>
                    <div class="flex gap-2">
                        <Button label="Cancel" outlined @click="closeModal" />
                        <Button label="Add Selected Items" @click="addSelectedItems" :disabled="!selectedItems.length" />
                    </div>
                </div>
            </div>
        </template>
    </Dialog>
</template>
