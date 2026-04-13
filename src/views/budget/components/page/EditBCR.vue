<script src="./EditBCR.script.ts"></script>

<template>
    <ProCard padding="lg">
        <!-- Header -->
        <ProCard title="Header Information" shadow class="mb-6">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <ProInput v-model="requestBy" label="Requested By" />
                </div>

                <div>
                    <ProInput v-model="requestDate" label="Date Requested" type="date" />
                </div>

                <div>
                    <ProSelect v-model="reason" :options="reasonOptions" label="Reason" />
                </div>

                <div>
                    <ProInput v-model="remark" label="Remark" />
                </div>
            </div>
        </ProCard>

        <!-- Table -->
        <ProCard title="Materials" shadow class="overflow-auto">
            <div class="flex justify-between mb-4">
                <h3 class="text-lg font-semibold">Materials</h3>
            </div>

            <DataTable :value="items" class="text-sm" style="min-width: 2000px">
                <Column field="ItemCode" header="Item Code" style="min-width: 150px">
                    <template #body="{ data }">
                        <ProSelect v-model="data.ItemCode" :options="allBudgetItems.map((b) => ({ label: b.itemCode, value: b.itemCode }))" @update:modelValue="() => fillSelectedItem(data)" class="w-full" />
                    </template>
                </Column>

                <Column field="Description" header="Description" style="min-width: 300px">
                    <template #body="{ data }">
                        <ProInput v-model="data.Description" disabled />
                    </template>
                </Column>

                <Column field="Uom" header="UOM" style="min-width: 100px">
                    <template #body="{ data }">
                        <ProInput v-model="data.Uom" disabled />
                    </template>
                </Column>

                <Column field="UnitPrice" header="Unit Price" style="min-width: 120px" v-if="canViewPricing">
                    <template #body="{ data }">
                        <ProInput v-model="data.UnitPrice" type="number" />
                    </template>
                </Column>

                <Column field="OrderedQty" header="Ordered Qty" style="min-width: 120px">
                    <template #body="{ data }">
                        <ProInput v-model="data.OrderedQty" type="number" />
                    </template>
                </Column>

                <Column field="NewOrder" header="Request Qty" style="min-width: 120px">
                    <template #body="{ data }">
                        <ProInput v-model="data.NewOrder" type="number" />
                    </template>
                </Column>

                <Column header="Exceeded Qty" style="min-width: 120px">
                    <template #body="{ data }">
                        <span :class="getColorClass(calcExceedQty(data))">
                            {{ calcExceedQty(data) }}
                        </span>
                    </template>
                </Column>

                <Column header="Exceeded %" style="min-width: 120px" v-if="canViewPricing">
                    <template #body="{ data }">
                        <span :class="getColorClass(calcExceedQty(data))"> {{ calcExceedPercent(data).toFixed(1) }}% </span>
                    </template>
                </Column>

                <Column header="Estimated $ Exceed" style="min-width: 150px" v-if="canViewPricing">
                    <template #body="{ data }">
                        <span :class="getColorClass(calcExceedQty(data))">
                            {{ calcEstimatedExceed(data).toFixed(2) }}
                        </span>
                    </template>
                </Column>

                <Column field="Remark" header="Remark" style="min-width: 400px">
                    <template #body="{ data }">
                        <ProInput v-model="data.Remark" />
                    </template>
                </Column>
            </DataTable>
        </ProCard>

        <div class="text-right font-semibold mt-4" v-if="canViewPricing">Total Variance Amount: {{ totalVarianceAmount.toFixed(2) }}</div>

        <div class="flex justify-end mb-6 mt-6">
            <div class="flex gap-2">
                <ProButton variant="secondary" @click="goBack">Cancel</ProButton>
                <ProButton variant="primary" @click="submitRequest">Submit Request</ProButton>
            </div>
        </div>
    </ProCard>
</template>

<style>
.p-inputtext {
    width: 100% !important;
}
</style>
