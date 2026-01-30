<script lang="ts" src="./ViewRo.script.ts"></script>

<template>
    <Dialog v-model:visible="localVisible" modal header="Details" class="w-11/12 md:w-2/3">
        <div v-if="localOrder">
            <h6 class="text-lg font-bold mb-6">
                Request Order :
                <span class="text-gray-500 font-normal">{{ localOrder.roNumber }}</span>
            </h6>

            <div class="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                    <p class="font-semibold">Status</p>
                    <p>{{ localOrder.status }}</p>
                </div>
                <div>
                    <p class="font-semibold">Requested At</p>
                    <p>{{ localOrder.requestedAt }}</p>
                </div>
                <div>
                    <p class="font-semibold">Requested By</p>
                    <p>{{ localOrder.requestedBy }}</p>
                </div>
                <div>
                    <p class="font-semibold">Budget Type</p>
                    <p>{{ localOrder.budgetType }}</p>
                </div>
                <div>
                    <p class="font-semibold">RO Date</p>
                    <p>{{ localOrder.roDate }}</p>
                </div>
            </div>

            <h3 class="font-semibold mb-2">Requested Items</h3>

            <table class="w-full border text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="p-2 text-left">Item Code</th>
                        <th class="p-2 text-left">Description</th>
                        <th class="p-2 text-left">UOM</th>
                        <th class="p-2 text-left">Order Qty</th>
                        <th class="p-2 text-left">Delivery Date</th>
                        <th class="p-2 text-left">Note</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, idx) in localOrder.items" :key="idx">
                        <td class="p-2">{{ item.code }}</td>
                        <td class="p-2">{{ item.description }}</td>
                        <td class="p-2">{{ item.uom }}</td>
                        <td class="p-2">{{ item.qty }}</td>
                        <td class="p-2">{{ item.deliveryDate }}</td>
                        <td class="p-2">{{ item.note }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="mt-4">
                <div v-if="existingAttachments.length > 0" class="mb-4">
                    <h4 class="text-sm font-semibold mb-2">Attachments</h4>
                    <div class="flex flex-wrap gap-2">
                        <div v-for="(file, index) in existingAttachments" :key="`existing-${index}`" class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                            <i class="pi pi-file text-gray-500"></i>
                            <span class="text-sm">{{ file.filename }}</span>
                            <span v-if="file.size" class="text-xs text-gray-500">({{ formatSize(file.size) }})</span>
                            <Button icon="pi pi-eye" text rounded severity="info" @click="previewAttachment(file)" v-tooltip="'Preview Attachment'" />
                        </div>
                    </div>
                </div>

                <div v-else class="text-gray-500 italic text-sm">No attachments available.</div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <template v-if="isPurchasingRole && localOrder?.status === 'Submitted'">
                    <Button label="Reject Request" severity="danger" outlined icon="pi pi-times" @click="handleReject" />
                    <Button label="Approve Request" severity="success" icon="pi pi-check" @click="handleApprove" />
                </template>

                <template v-else>
                    <Button label="Close" severity="secondary" icon="pi pi-times" @click="handleClose" />
                </template>
            </div>
        </template>
    </Dialog>
</template>
