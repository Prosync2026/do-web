<script lang="ts" src="./ReviewDelivery.script"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6 p-3">
                <div class="flex flex-col">
                    <div class="flex items-center gap-3">
                        <h1 class="text-h2 text-text-heading">Review - {{ deliveryOrder?.DocNo || 'Loading...' }}</h1>
                        <ProTag label="Ready for Review" variant="warning" />
                    </div>
                    <p class="text-sm text-gray-500 mt-1">{{ deliveryOrder?.SupplierName || 'Unknown Supplier' }}</p>
                </div>
                <div class="flex gap-2">
                    <ProButton variant="secondary" @click="handleCancel">
                        Cancel
                    </ProButton>
                    <ProButton variant="primary" @click="handleMarkAsReviewed">
                        <template #iconLeft><PhCheck :size="16" /></template>
                        Mark as Reviewed
                    </ProButton>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- LEFT SIDE: DO Document Preview -->
                <div class="col-span-1 lg:col-span-5 flex flex-col gap-6">
                    <ProCard title="DO Document Preview" class="shadow-sm">
                        <div class="bg-surface-50 w-full overflow-y-auto overflow-x-hidden md:flex md:items-center md:justify-center relative border rounded-lg" style="min-height: 600px; -webkit-overflow-scrolling: touch;">
                            <!-- PDF preview -->
                            <iframe
                                v-if="filePreviewUrl && selectedFile?.type === 'application/pdf'"
                                :src="filePreviewUrl"
                                class="w-full h-full border-0 absolute top-0 left-0"
                            />
                            <!-- Image preview -->
                            <img
                                v-else-if="filePreviewUrl"
                                :src="filePreviewUrl"
                                class="max-w-full max-h-full object-contain p-2"
                                alt="Uploaded document"
                            />
                            <div v-else class="text-gray-400 text-sm text-center p-6">
                                <i class="pi pi-file-pdf text-4xl block mb-2" />
                                Preview not available
                            </div>
                        </div>
                    </ProCard>
                </div>

                <!-- RIGHT SIDE: Review Details & Line Items -->
                <div class="col-span-1 lg:col-span-7 flex flex-col gap-6">
                    <!-- Review Details Card -->
                    <ProCard class="shadow-sm">
                        <template #header>
                            <div class="flex justify-between items-center p-4 border-b border-gray-100">
                                <span class="text-lg font-bold">Review Details</span>
                                <ProTag label="AI Extracted" variant="success" icon="pi pi-sparkles" />
                            </div>
                        </template>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">SO/PO Number <span class="text-red-500">*</span></label>
                                <ProInput v-model="deliveryOrder.RefDoc" placeholder="PO-XXXXX" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Date <span class="text-red-500">*</span></label>
                                <ProInput v-model="deliveryOrder.Date" type="date" placeholder="YYYY-MM-DD" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plate Number</label>
                                <ProInput v-model="deliveryOrder.PlateNo" placeholder="e.g. WKL 3456" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier / Vendor <span class="text-red-500">*</span></label>
                                <ProInput v-model="deliveryOrder.SupplierName" placeholder="Supplier name" />
                            </div>
                        </div>
                    </ProCard>

                    <!-- Line Items Card -->
                    <ProCard class="shadow-sm">
                        <template #header>
                            <div class="p-4 border-b border-gray-100">
                                <span class="text-lg font-bold">Line Items</span>
                            </div>
                        </template>

                        <div class="flex flex-col">
                            <div v-for="(item, index) in extractedItems" :key="index" class="p-4 border-b border-gray-100 last:border-b-0">
                                <!-- Item Header -->
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex items-start gap-3">
                                        <div class="w-8 h-8 rounded bg-gray-100 text-gray-600 flex flex-shrink-0 items-center justify-center text-sm font-semibold mt-1">
                                            #{{ index + 1 }}
                                        </div>
                                        <div>
                                            <p class="font-bold text-gray-900">{{ item.description || 'Unknown Item' }}</p>
                                            <p class="text-sm text-gray-500">{{ item.itemCode || 'No Code' }} &middot; {{ item.qty }} {{ item.uom }}</p>
                                        </div>
                                    </div>
                                    <button class="text-gray-400 hover:text-red-500 transition-colors">
                                        <PhTrash :size="18" />
                                    </button>
                                </div>

                                <!-- PO Qty & UOM -->
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div class="flex flex-col">
                                        <span class="text-xs text-gray-500 font-medium mb-1">PO Qty</span>
                                        <span class="text-gray-900">{{ item.qty }}</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-xs text-gray-500 font-medium mb-1">UOM</span>
                                        <span class="text-gray-900">{{ item.uom }}</span>
                                    </div>
                                </div>

                                <!-- Delivery Splits Section -->
                                <div class="mt-4">
                                    <div class="flex justify-between items-center mb-3">
                                        <span class="text-sm font-bold text-gray-700">Delivery Splits</span>
                                        <button @click="addSplit(item)" class="text-brand-primary text-sm font-semibold hover:underline flex items-center gap-1">
                                            <PhPlus :size="14" /> Add Split
                                        </button>
                                    </div>

                                    <div class="flex flex-col gap-4">
                                        <div v-for="(split, splitIndex) in item.splits" :key="splitIndex" class="border rounded-lg p-3 bg-gray-50/50">
                                            <div class="flex justify-between items-center mb-2">
                                                <span class="text-xs font-semibold text-gray-500">Split #{{ Number(splitIndex) + 1 }}</span>
                                                <button @click="removeSplit(item, splitIndex)" class="text-gray-400 hover:text-red-500">
                                                    <PhTrash :size="14" />
                                                </button>
                                            </div>
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                <div class="flex flex-col gap-1">
                                                    <label class="text-xs font-medium text-gray-600">Delivered</label>
                                                    <ProInput v-model="split.delivered" placeholder="Qty" />
                                                </div>
                                                <div class="flex flex-col gap-1">
                                                    <label class="text-xs font-medium text-gray-600">Received</label>
                                                    <ProInput v-model="split.received" placeholder="Qty" />
                                                </div>
                                                <div class="flex flex-col gap-1">
                                                    <label class="text-xs font-medium text-gray-600">Location</label>
                                                    <ProInput v-model="split.location" placeholder="e.g. Block A > Level 1" />
                                                </div>
                                            </div>
                                            <div class="flex flex-col gap-1">
                                                <label class="text-xs font-medium text-gray-600">Remarks</label>
                                                <ProInput v-model="split.remarks" placeholder="Notes" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ProCard>
                </div>
            </div>
        </div>
    </Motion>
</template>
