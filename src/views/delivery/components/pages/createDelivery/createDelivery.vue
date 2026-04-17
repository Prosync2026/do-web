<script lang="ts" src="./createDelivery.script"></script>

<template>
    <div class="p-1">
        <ProCard class="flex flex-col items-center shadow-sm w-full relative z-0">
            <!-- Custom HTML Stepper instead of PrimeVue Stepper -->
            <div class="w-full max-w-4xl mx-auto mb-8 relative px-4">
                <!-- Connecting line -->
                <div class="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10"></div>
                <div class="absolute top-5 left-[10%] h-0.5 bg-brand-primary -z-10 transition-all duration-300" :style="{ width: ((activeStep - 1) / 3) * 80 + '%' }"></div>
                
                <!-- Steps relative layout -->
                <div class="flex justify-between items-center w-full z-10 relative">
                    <!-- Step 1 -->
                    <div class="flex flex-col items-center gap-2 cursor-pointer w-24">
                        <div :class="['w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300', activeStep >= 1 ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface-main-bg border-gray-300 text-gray-400']">
                            <i class="pi pi-box"></i>
                        </div>
                        <span :class="['text-sm font-medium', activeStep >= 1 ? 'text-brand-primary' : 'text-gray-500']">Select PO</span>
                    </div>

                    <!-- Step 2 -->
                    <div class="flex flex-col items-center gap-2 cursor-pointer w-24">
                        <div :class="['w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300', activeStep >= 2 ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface-main-bg border-gray-300 text-gray-400']">
                            <i class="pi pi-check"></i>
                        </div>
                        <span :class="['text-sm font-medium', activeStep >= 2 ? 'text-brand-primary' : 'text-gray-500']">Verify Items</span>
                    </div>

                    <!-- Step 3 -->
                    <div class="flex flex-col items-center gap-2 cursor-pointer w-24">
                        <div :class="['w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300', activeStep >= 3 ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface-main-bg border-gray-300 text-gray-400']">
                            <i class="pi pi-truck"></i>
                        </div>
                        <span :class="['text-sm font-medium', activeStep >= 3 ? 'text-brand-primary' : 'text-gray-500']">Delivery Info</span>
                    </div>

                    <!-- Step 4 -->
                    <div class="flex flex-col items-center gap-2 cursor-pointer w-24">
                        <div :class="['w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300', activeStep >= 4 ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface-main-bg border-gray-300 text-gray-400']">
                            <i class="pi pi-file"></i>
                        </div>
                        <span :class="['text-sm font-medium', activeStep >= 4 ? 'text-brand-primary' : 'text-gray-500']">Review</span>
                    </div>
                </div>
            </div>

            <!-- Step Panels -->
            <div class="w-full max-w-6xl mt-4">
                <div v-show="activeStep === 1">
                    <SelectPO @update="handleStep1Update" @smartScan="handleSmartScan" @smartScanManual="handleSmartScanManual" />
                </div>
                <div v-show="activeStep === 2">
                    <VerifyItem @update="handleStep2Update" @next-step="goStep(3)" :selected-po="deliveryData.selectPO" @prev-step="goStep(1)" />
                </div>
                <div v-show="activeStep === 3">
                    <DeliveryInfo @update="handleStep3Update" @next-step="goStep(4)" @prev-step="goStep(2)" :prefill-attachment="scanAttachment" :prefill-plate="scannedPlate" />
                </div>
                <div v-show="activeStep === 4">
                    <div v-if="canPassToReview">
                        <Review :deliveryData="deliveryData" />
                    </div>
                    <div v-else class="flex flex-col justify-center py-5 gap-4 w-full">
                        <Message severity="warn" variant="outlined" :closable="false">
                            <i class="pi pi-exclamation-triangle mr-2"></i>
                            Please complete all previous steps before reviewing.
                        </Message>
                        <div class="flex justify-end mt-4 gap-2 w-full">
                            <ProButton variant="secondary" @click="goStep(1)">Back</ProButton>
                        </div>
                    </div>
                </div>
            </div>
        </ProCard>
    </div>
</template>
