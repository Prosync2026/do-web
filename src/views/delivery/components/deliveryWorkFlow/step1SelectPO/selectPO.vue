<script lang="ts" src="./selectPO.script.ts"></script>

<template>
    <div class="p-mb-5 mt-5">
        <!-- Info Message -->
        <Message severity="secondary" variant="outlined" :closable="false">
            <i class="pi pi-box"></i>
            Select the Purchase Order that corresponds to this delivery. You can search by PO number or item name.
        </Message>

        <!-- ─── Smart Scan Banner ───────────────────────────────────────── -->
        <div class="mt-4 p-4 rounded-xl border border-primary/30 bg-primary-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <i class="pi pi-sparkles text-primary text-lg" />
                </div>
                <div>
                    <p class="font-semibold text-gray-800">Have a delivery document?</p>
                    <p class="text-sm text-gray-500 mt-0.5">Upload it and AI will extract all items, quantities and SO number automatically.</p>
                </div>
            </div>
            <ProButton @click="showScanModal = true" class="shrink-0"><i class="pi pi-sparkles mt-1 mr-2" /> Smart Scan DO</ProButton>
        </div>

        <!-- Search + Cards -->
        <ProCard title="Search Purchase Order" class="mt-6 shadow-sm">
                <Form @submit="onFormSubmit" class="flex flex-col gap-4 mt-1 w-full sm:w-full">
                    <!-- AutoComplete Search -->
                    <!-- Search Section -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
                        <div class="flex gap-2 relative">
                            <ProInput v-model="searchTerm" placeholder="Search PO Number..." class="w-full" @input="handleManualSearchInput" />
                            <ProButton variant="secondary" class="bg-gray-200 shrink-0" rounded @click="handleClearSearch" title="Clear search"><i class="pi pi-times mt-1 shrink-0" /></ProButton>
                        </div>
                    </div>

                    <!-- Cards List -->
                    <div class="grid grid-cols-1 gap-4 p-3">
                        <ProCard v-for="card in filteredCards" :key="card.id" class="relative border rounded-lg cursor-pointer transition-colors" :class="isSelected(card) ? 'bg-gray-100 hover:bg-gray-200 border-primary shadow-sm' : 'hover:border-gray-300'" @click="toggleSelect(card)">
                                <div v-if="isSelected(card)" class="absolute top-2 left-2 right-2 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</span>
                                        <span class="text-sm font-medium text-green-700">Selected Purchase Order</span>
                                    </div>
                                    <button class="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white text-sm" @click.stop="removeCard(card)">✕</button>
                                </div>

                                <div :class="['flex justify-between items-start', isSelected(card) ? 'mt-5' : 'mt-0']">
                                    <div>
                                        <h4 class="font-semibold mb-1">{{ card.title }}</h4>
                                        <p class="text-gray-600 mb-2 text-xs">{{ card.content }}</p>
                                        <div class="flex gap-2 flex-wrap" v-if="!isSelected(card)">
                                            <ProTag v-for="(badge, i) in card.badges" :key="i" :label="badge" variant="info" class="bg-gray-200 text-gray-700" />
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg" v-if="!isSelected(card)">
                                        <i :class="['text-gray-700 text-xl pi', card.icon]"></i>
                                    </div>
                                </div>
                        </ProCard>
                    </div>

                    <!-- Pagination Controls -->
                    <div class="flex justify-between items-center mt-4 gap-2" v-if="purchaseStore.pagination">
                        <div class="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select :value="purchaseStore.pagination?.pageSize ?? 10" @change="handlePageSizeChange" class="border rounded px-2 py-1">
                                <option v-for="size in [10, 25, 50, 100]" :key="size" :value="size">{{ size }}</option>
                            </select>
                        </div>

                        <div class="flex items-center gap-1">
                            <ProButton variant="ghost" :disabled="(purchaseStore.pagination?.page ?? 1) <= 1" @click="setPage(1)"><i class="pi pi-angle-double-left shrink-0" /></ProButton>
                            <ProButton variant="ghost" :disabled="(purchaseStore.pagination?.page ?? 1) <= 1" @click="setPage((purchaseStore.pagination?.page ?? 1) - 1)"><i class="pi pi-angle-left shrink-0" /></ProButton>
                            <span> Page {{ purchaseStore.pagination?.page ?? 1 }} / {{ purchaseStore.pagination?.totalPages ?? 1 }} </span>
                            <ProButton variant="ghost" :disabled="(purchaseStore.pagination?.page ?? 1) >= (purchaseStore.pagination?.totalPages ?? 1)" @click="setPage((purchaseStore.pagination?.page ?? 1) + 1)"><i class="pi pi-angle-right shrink-0" /></ProButton>
                            <ProButton variant="ghost" :disabled="(purchaseStore.pagination?.page ?? 1) >= (purchaseStore.pagination?.totalPages ?? 1)" @click="setPage(purchaseStore.pagination?.totalPages ?? 1)"><i class="pi pi-angle-double-right shrink-0" /></ProButton>
                        </div>

                        <div>
                            Showing
                            {{ displayStart }} – {{ displayEnd }} of {{ purchaseStore.pagination?.total ?? 0 }}
                        </div>
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="flex justify-end mt-4 gap-2">
                        <ProButton type="submit">Next</ProButton>
                    </div>
                </Form>
        </ProCard>
        <!-- Smart Scan Modal -->
        <SmartScanModal v-model="showScanModal" @confirm="onScanConfirm" @manual="onScanManual" />
    </div>
</template>

<style scoped>
:deep(.p-card.selected) {
    background-color: rgb(243 244 246) !important;
}
</style>
