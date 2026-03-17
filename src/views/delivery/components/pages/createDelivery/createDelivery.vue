<script lang="ts" src="./createDelivery.script"></script>

<template>
    <div>
        <div class="card flex flex-col items-center">
            <div class="w-full mb-4">
                <BreadcrumbList />
            </div>

            <Stepper v-model:value="activeStep" class="w-full max-w-6xl mt-4" :clickable="false">
                <StepList class="flex justify-between">
                    <!-- Step 1 -->
                    <Step :value="1">
                        <div class="flex flex-col items-center gap-2">
                            <span
                                :class="[
                                    'rounded-full border-2 w-8 h-8 flex items-center justify-center',
                                    {
                                        'bg-primary text-primary-contrast border-primary': 1 <= activeStep,
                                        'border-surface-200 dark:border-surface-700': 1 > activeStep
                                    }
                                ]"
                            >
                                <i class="pi pi-box" />
                            </span>
                            <span class="text-sm font-medium" :class="{ 'text-primary': 1 <= activeStep }"> Select PO </span>
                        </div>
                    </Step>

                    <!-- Step 2 -->
                    <Step :value="2">
                        <div class="flex flex-col items-center gap-2">
                            <span
                                :class="[
                                    'rounded-full border-2 w-8 h-8 flex items-center justify-center',
                                    {
                                        'bg-primary text-primary-contrast border-primary': 2 <= activeStep,
                                        'border-surface-200 dark:border-surface-700': 2 > activeStep
                                    }
                                ]"
                            >
                                <i class="pi pi-check" />
                            </span>
                            <span class="text-sm font-medium" :class="{ 'text-primary': 2 <= activeStep }"> Verify Items </span>
                        </div>
                    </Step>

                    <!-- Step 3 -->
                    <Step :value="3">
                        <div class="flex flex-col items-center gap-2">
                            <span
                                :class="[
                                    'rounded-full border-2 w-8 h-8 flex items-center justify-center',
                                    {
                                        'bg-primary text-primary-contrast border-primary': 3 <= activeStep,
                                        'border-surface-200 dark:border-surface-700': 3 > activeStep
                                    }
                                ]"
                            >
                                <i class="pi pi-truck" />
                            </span>
                            <span class="text-sm font-medium" :class="{ 'text-primary': 3 <= activeStep }"> Delivery Info </span>
                        </div>
                    </Step>

                    <!-- Step 4 -->
                    <Step :value="4">
                        <div class="flex flex-col items-center gap-2">
                            <span
                                :class="[
                                    'rounded-full border-2 w-8 h-8 flex items-center justify-center',
                                    {
                                        'bg-primary text-primary-contrast border-primary': 4 <= activeStep,
                                        'border-surface-200 dark:border-surface-700': 4 > activeStep
                                    }
                                ]"
                            >
                                <i class="pi pi-file" />
                            </span>
                            <span class="text-sm font-medium" :class="{ 'text-primary': 4 <= activeStep }"> Review </span>
                        </div>
                    </Step>
                </StepList>

                <!-- Panels -->
                <StepPanels>
                    <StepPanel :value="1">
                        <SelectPO @update="handleStep1Update" @smartScan="handleSmartScan" @smartScanManual="handleSmartScanManual" />
                    </StepPanel>
                    <StepPanel :value="2">
                        <VerifyItem @update="handleStep2Update" @next-step="goStep(3)" :selected-po="deliveryData.selectPO" @prev-step="goStep(1)" />
                    </StepPanel>
                    <StepPanel :value="3">
                        <DeliveryInfo @update="handleStep3Update" @next-step="goStep(4)" @prev-step="goStep(2)" :prefill-attachment="scanAttachment" />
                    </StepPanel>
                    <StepPanel :value="4">
                        <div v-if="canPassToReview"><Review :deliveryData="deliveryData" /></div>
                        <div v-else class="flex flex-col justify-center py-5 gap-4 w-full">
                            <Message severity="warn" variant="outlined" :closable="false">
                                <i class="pi pi-exclamation-triangle mr-2"></i>
                                Please complete all previous steps before reviewing.
                            </Message>

                            <div class="flex justify-end mt-4 gap-2 w-full">
                                <Button type="button" label="Back" severity="secondary" @prev-step="goStep(1)" />
                            </div>
                        </div>
                    </StepPanel>
                </StepPanels>
            </Stepper>
        </div>
    </div>
</template>
