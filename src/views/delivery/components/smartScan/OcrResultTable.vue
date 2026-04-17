<script lang="ts" src="./OcrResultTable.script.ts"></script>

<template>
    <div class="w-full overflow-x-auto">
        <table class="w-full text-sm border-collapse">
            <thead>
                <tr class="bg-surface-50 border-b">
                    <th class="px-3 py-2 text-left font-semibold text-gray-600 w-10">#</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-600">Item Code</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-600 w-24">Qty</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-600 w-24">UOM</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-600">Remarks</th>
                    <th class="px-3 py-2 w-10"></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, idx) in items" :key="idx" class="border-b hover:bg-gray-50 transition-colors" :class="{ 'bg-amber-50': hasLowConfidence(item) }">
                    <td class="px-3 py-2 text-gray-400 text-center">{{ idx + 1 }}</td>

                    <!-- Item Code -->
                    <td class="px-2 py-1">
                        <div class="relative">
                            <ProInput v-model="item.itemCode" class="w-full" :class="{ 'border-amber-400 bg-amber-50': isLow(item.confidence?.itemCode) }" placeholder="Item code" />
                            <i v-if="isLow(item.confidence?.itemCode)" class="pi pi-exclamation-triangle absolute right-2 top-2 text-amber-500 text-xs" title="Low confidence — please verify" />
                        </div>
                    </td>

                    <!-- Description -->
                    <td class="px-2 py-1">
                        <ProInput v-model="item.description" class="w-full" :class="{ 'border-amber-400 bg-amber-50': isLow(item.confidence?.description) }" placeholder="Description" />
                    </td>

                    <!-- Qty -->
                    <td class="px-2 py-1">
                        <ProInput v-model="item.qty" type="number" class="w-full" :class="{ 'border-amber-400 bg-amber-50': isLow(item.confidence?.qty) }" placeholder="0" />
                    </td>

                    <!-- UOM -->
                    <td class="px-2 py-1">
                        <ProInput v-model="item.uom" class="w-full" :class="{ 'border-amber-400 bg-amber-50': isLow(item.confidence?.uom) }" placeholder="UOM" />
                    </td>

                    <!-- Remarks -->
                    <td class="px-2 py-1">
                        <ProInput v-model="item.remarks" class="w-full" placeholder="Remarks" />
                    </td>

                    <!-- Remove row -->
                    <td class="px-2 py-1 text-center">
                        <ProButton variant="danger" rounded @click="removeRow(idx)" title="Remove row"><i class="pi pi-trash mt-1 shrink-0" /></ProButton>
                    </td>
                </tr>

                <!-- Empty state -->
                <tr v-if="items.length === 0">
                    <td colspan="7" class="px-3 py-6 text-center text-gray-400 italic">No items extracted. Add rows manually below.</td>
                </tr>
            </tbody>
        </table>

        <!-- Low confidence legend -->
        <div v-if="hasAnyLowConfidence" class="flex items-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <i class="pi pi-exclamation-triangle text-amber-500" />
            <span>Highlighted cells have low OCR confidence — please review and correct before confirming.</span>
        </div>

        <!-- Add row button -->
        <div class="mt-3">
            <ProButton variant="secondary" @click="addRow"><i class="pi pi-plus mt-1 mr-2" /> Add Row</ProButton>
        </div>
    </div>
</template>
