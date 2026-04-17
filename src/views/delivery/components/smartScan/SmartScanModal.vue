<script lang="ts" src="./SmartScanModal.script.ts"></script>

<template>
    <Teleport to="body">
        <ProModal v-model="visible" @update:modelValue="(val: boolean) => { if(!val && !isScanning) onClose() }" :size="phase === 'result' ? 'full' : 'large'" class="!z-[999]">
        <template #header>
            <div class="flex items-center gap-2">
                <i class="pi pi-sparkles text-brand-primary text-xl" />
                <span class="font-bold text-lg">Smart Scan Delivery Order</span>
            </div>
        </template>

        <!--  STEP: UPLOAD  -->
        <div v-if="phase === 'upload'" class="p-5">
            <Message severity="secondary" variant="outlined" :closable="false" class="mb-4">
                <i class="pi pi-info-circle mr-2" />
                Upload your delivery document (PDF or image). AI will extract the SO number, items, descriptions, quantities and UOM automatically.
            </Message>

            <!-- Drop zone -->
            <div
                class="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 p-10 cursor-pointer transition-colors"
                :class="isDragging ? 'border-primary bg-primary-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDrop"
                @click="triggerFileInput"
            >
                <i class="pi pi-cloud-upload text-5xl text-gray-400" />
                <div class="text-center">
                    <p class="font-semibold text-gray-700">Drag &amp; drop your document here</p>
                    <p class="text-sm text-gray-400 mt-1">or click to browse</p>
                    <p class="text-xs text-gray-400 mt-1">Supports PDF, JPG, PNG · Max 10 MB</p>
                </div>
                <input ref="fileInput" type="file" accept="image/*,application/pdf" class="hidden" @change="onFileInputChange" />
            </div>

            <!-- Selected file preview -->
            <div v-if="selectedFile" class="mt-4 flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                <i class="pi text-2xl text-primary" :class="selectedFile.type.startsWith('image') ? 'pi-image' : 'pi-file-pdf'" />
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm truncate">{{ selectedFile.name }}</p>
                    <p class="text-xs text-gray-400">{{ formatSize(selectedFile.size) }}</p>
                </div>
                <ProButton icon="pi pi-times" variant="plain" @click="clearFile" />
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 mt-5">
                <ProButton variant="secondary" @click="onClose">Cancel</ProButton>
                <ProButton :loading="isScanning" :disabled="!selectedFile" @click="startScan"><i class="pi pi-sparkles mt-1 mr-2" /> Scan Document</ProButton>
            </div>
        </div>

        <!--  STEP: SCANNING  -->
        <div v-else-if="phase === 'scanning'" class="flex flex-col items-center justify-center gap-6 py-16 px-5">
            <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="4" />
            <div class="text-center">
                <p class="font-semibold text-lg text-gray-700">Reading your document…</p>
                <p class="text-sm text-gray-400 mt-1">{{ scanningMessage }}</p>
            </div>
        </div>

        <!--  STEP: RESULT  -->
        <div v-else-if="phase === 'result'" class="flex flex-col" style="min-height: 520px;">

            <!-- Side-by-side body -->
            <div class="flex flex-1 overflow-hidden divide-x divide-surface-200" style="min-height: 480px;">

                <!-- LEFT: Extracted OCR data -->
                <div class="flex flex-col flex-1 overflow-y-auto p-4" style="min-width: 0;">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        <i class="pi pi-sparkles mr-1 text-orange-500" /> AI Extracted Data
                    </p>

                    <!-- Header fields -->
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">SO / PO Number</label>
                            <ProInput v-model="ocrResult.soNo" placeholder="SO-XXXXX" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">DO Number</label>
                            <ProInput v-model="ocrResult.doNo" placeholder="DO-XXXXX" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Date</label>
                            <ProInput v-model="ocrResult.deliveryDate" placeholder="YYYY-MM-DD" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lorry Plate No</label>
                            <ProInput v-model="ocrResult.plateNo" placeholder="e.g. WXY1234" />
                        </div>
                        <div class="flex flex-col gap-1 col-span-2">
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier / Vendor</label>
                            <ProInput v-model="ocrResult.supplierName" placeholder="Supplier name" class="w-full" />
                        </div>
                    </div>

                    <!-- Line items -->
                    <div class="flex-1">
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Line Items ({{ ocrResult.items.length }} extracted)</label>
                        <OcrResultTable v-model:items="ocrResult.items" />
                    </div>
                </div>

                <!-- RIGHT: Original file preview -->
                <div class="flex flex-col" style="width: 48%; min-width: 320px;">
                    <div class="px-4 pt-4 pb-2 border-b border-surface-100 flex items-center gap-2">
                        <i class="pi pi-file text-orange-500" />
                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Original Document</p>
                        <span class="ml-auto text-xs text-gray-400 truncate max-w-[160px]" :title="selectedFile?.name">{{ selectedFile?.name }}</span>
                    </div>
                    <div class="flex-1 bg-surface-50 flex items-center justify-center overflow-hidden" style="min-height: 400px;">
                        <!-- PDF preview -->
                        <iframe
                            v-if="filePreviewUrl && selectedFile?.type === 'application/pdf'"
                            :src="filePreviewUrl"
                            class="w-full h-full border-0"
                            style="min-height: 440px;"
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
                </div>
            </div>

            <!-- Actions footer -->
            <div class="flex justify-between items-center px-4 py-3 border-t border-surface-200 mt-4">
                <div class="flex gap-2">
                    <ProButton variant="secondary" @click="phase = 'upload'"><i class="pi pi-refresh mt-1 mr-2" /> Re-scan</ProButton>
                    <ProButton variant="plain" @click="onManualFallback"><i class="pi pi-pencil mt-1 mr-2" /> Enter Manually</ProButton>
                </div>
                <ProButton :disabled="ocrResult.items.length === 0" @click="onConfirm"><i class="pi pi-check mt-1 mr-2" /> Confirm &amp; Proceed</ProButton>
            </div>
        </div>

        <!--  STEP: ERROR ─ -->
        <div v-else-if="phase === 'error'" class="flex flex-col items-center gap-5 py-14 px-5 text-center">
            <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <i class="pi pi-times-circle text-3xl text-red-500" />
            </div>
            <div>
                <p class="font-bold text-lg text-gray-800">Could not read the document</p>
                <p class="text-sm text-gray-500 mt-1 max-w-sm">{{ errorMessage }}</p>
            </div>
            <div class="flex gap-2">
                <ProButton @click="phase = 'upload'"><i class="pi pi-refresh mt-1 mr-2" /> Try Again</ProButton>
                <ProButton variant="secondary" @click="onManualFallback"><i class="pi pi-pencil mt-1 mr-2" /> Enter Manually</ProButton>
            </div>
        </div>
        </ProModal>
    </Teleport>
</template>
