<script lang="ts" src="./selectPO.script.ts"></script>

<template>
    <div class="p-mb-5 mt-5">
        <!-- Info Message -->
        <Message severity="secondary" variant="outlined" :closable="false">
            <i class="pi pi-box"></i>
            Select the Purchase Order that corresponds to this delivery. You can search by PO number or item name.
        </Message>

        <!-- Search + Cards -->
        <Card class="mt-6 border">
            <template #title>
                <div class="flex items-center gap-2">
                    <i class="pi pi-search"></i>
                    <span>Search Purchase Order</span>
                </div>
            </template>

            <template #content>
                <Form @submit="onFormSubmit" class="flex flex-col gap-4 mt-1 w-full sm:w-full">
                    <!-- AutoComplete Search -->
                    <!-- Search Section -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
                        <!-- AutoComplete Search -->
                        <div class="flex gap-2">
                            <AutoComplete v-model="selectedCard" :suggestions="filteredCards" field="title" option-label="title" forceSelection dropdown placeholder="Search PO Number..." @complete="handlePOSearch" />
                            <Button icon="pi pi-times" severity="secondary" class="bg-gray-200" rounded @click="handleClearSearch" v-tooltip="'Clear search'" />
                        </div>

                        <!-- Manual PO Number Search -->
                        <!-- <InputText v-model="manualSearch" placeholder="Search by PO Number..." class="w-full" @input="handleManualSearch" /> -->
                    </div>

                    <!-- Cards List -->
                    <div class="grid grid-cols-1 gap-4 p-3">
                        <Card v-for="card in filteredCards" :key="card.id" class="relative border rounded-lg cursor-pointer transition-colors" :class="isSelected(card) ? 'selected' : ''" @click="toggleSelect(card)">
                            <template #content>
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
                                            <Badge v-for="(badge, i) in card.badges" :key="i" :value="badge" severity="secondary" class="bg-gray-200 text-gray-700" />
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg" v-if="!isSelected(card)">
                                        <i :class="['text-gray-700 text-xl pi', card.icon]"></i>
                                    </div>
                                </div>
                            </template>
                        </Card>
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
                            <Button icon="pi pi-angle-double-left" text :disabled="(purchaseStore.pagination?.page ?? 1) <= 1" @click="setPage(1)" />
                            <Button icon="pi pi-angle-left" text :disabled="(purchaseStore.pagination?.page ?? 1) <= 1" @click="setPage((purchaseStore.pagination?.page ?? 1) - 1)" />
                            <span> Page {{ purchaseStore.pagination?.page ?? 1 }} / {{ purchaseStore.pagination?.totalPages ?? 1 }} </span>
                            <Button icon="pi pi-angle-right" text :disabled="(purchaseStore.pagination?.page ?? 1) >= (purchaseStore.pagination?.totalPages ?? 1)" @click="setPage((purchaseStore.pagination?.page ?? 1) + 1)" />
                            <Button icon="pi pi-angle-double-right" text :disabled="(purchaseStore.pagination?.page ?? 1) >= (purchaseStore.pagination?.totalPages ?? 1)" @click="setPage(purchaseStore.pagination?.totalPages ?? 1)" />
                        </div>

                        <div>
                            Showing
                            {{ displayStart }} – {{ displayEnd }} of {{ purchaseStore.pagination?.total ?? 0 }}
                        </div>
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="flex justify-end mt-4 gap-2">
                        <Button type="submit" label="Next" severity="primary" />
                    </div>
                </Form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
:deep(.p-card.selected) {
    background-color: rgb(243 244 246) !important;
}
</style>
