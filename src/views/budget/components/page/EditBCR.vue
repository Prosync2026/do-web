<script src="./EditBCR.script.ts"></script>

<template>
    <div class="p-6 card">
        <BreadcrumbList />

        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">Edit Budget Change Request</h1>
        </div>

        <!-- Header -->
        <div class="card p-4 mb-6 shadow">
            <h3 class="text-lg font-semibold mb-4">Header Information</h3>

            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <label>Requested By</label>
                    <InputText v-model="requestBy" class="w-full" />
                </div>

                <div>
                    <label>Date Requested</label>
                    <Calendar v-model="requestDate" dateFormat="yy-mm-dd" class="w-full" showIcon />
                </div>

                <div>
                    <label>Reason</label>
                    <Dropdown v-model="reason" :options="reasonOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div>
                    <label>Remark</label>
                    <InputText v-model="remark" class="w-full" />
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="card p-4 shadow overflow-auto">
            <div class="flex justify-between mb-4">
                <h3 class="text-lg font-semibold">Materials</h3>
            </div>

            <DataTable :value="items" class="text-sm" style="min-width: 2000px">
                <Column field="ItemCode" header="Item Code" style="min-width: 150px">
                    <template #body="{ data }">
                        <Dropdown v-model="data.ItemCode" :options="allBudgetItems.map((b) => ({ label: b.itemCode, value: b.itemCode }))" optionLabel="label" optionValue="value" @change="() => fillSelectedItem(data)" class="w-full" />
                    </template>
                </Column>

                <Column field="Description" header="Description" style="min-width: 300px">
                    <template #body="{ data }">
                        <InputText v-model="data.Description" class="w-full" disabled />
                    </template>
                </Column>

                <Column field="Uom" header="UOM" style="min-width: 100px">
                    <template #body="{ data }">
                        <InputText v-model="data.Uom" disabled class="w-full" />
                    </template>
                </Column>

                <Column field="UnitPrice" header="Unit Price" style="min-width: 120px">
                    <template #body="{ data }">
                        <InputText v-model="data.UnitPrice" type="number" class="w-full" />
                    </template>
                </Column>

                <Column field="OrderedQty" header="Ordered Qty" style="min-width: 120px">
                    <template #body="{ data }">
                        <InputText v-model="data.OrderedQty" type="number" class="w-full" />
                    </template>
                </Column>

                <Column field="NewOrder" header="Request Qty" style="min-width: 120px">
                    <template #body="{ data }">
                        <InputText v-model="data.NewOrder" type="number" class="w-full" />
                    </template>
                </Column>

                <Column header="Exceeded Qty" style="min-width: 120px">
                    <template #body="{ data }">
                        <span :class="getColorClass(calcExceedQty(data))">
                            {{ calcExceedQty(data) }}
                        </span>
                    </template>
                </Column>

                <Column header="Exceeded %" style="min-width: 120px">
                    <template #body="{ data }">
                        <span :class="getColorClass(calcExceedQty(data))"> {{ calcExceedPercent(data).toFixed(1) }}% </span>
                    </template>
                </Column>

                <Column header="Estimated $ Exceed" style="min-width: 150px">
                    <template #body="{ data }">
                        <span :class="getColorClass(calcExceedQty(data))">
                            {{ calcEstimatedExceed(data).toFixed(2) }}
                        </span>
                    </template>
                </Column>

                <Column field="Remark" header="Remark" style="min-width: 400px">
                    <template #body="{ data }">
                        <InputText v-model="data.Remark" class="w-full" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <div class="text-right font-semibold mt-4">Total Variance Amount: {{ totalVarianceAmount.toFixed(2) }}</div>

        <div class="flex justify-end mb-6 mt-6">
            <div class="flex gap-2">
                <Button label="Cancel" @click="goBack" outlined />
                <Button label="Submit Request" @click="submitRequest" />
            </div>
        </div>
    </div>
</template>

<style>
.p-calendar,
.p-inputtext {
    width: 100% !important;
}
</style>
