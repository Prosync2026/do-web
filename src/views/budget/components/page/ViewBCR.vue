<script src="./ViewBCR.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -20 }" :transition="{ duration: 0.6 }">
        <div class="p-6 card">
            <BreadcrumbList />

            <BaseTab v-model="activeTab" :tabs="tabItems">
                <template #default="{ activeTab }">
                    <!-- Tab: Detail -->
                    <div v-if="activeTab === 'detail'">
                        <!-- Page Header -->
                        <div class="flex items-center justify-between mb-6">
                            <div>
                                <h1 class="text-2xl font-bold">View Budget Change Request</h1>
                                <p class="text-gray-500 mt-1">Project: {{ projectName }}</p>
                            </div>
                        </div>

                        <!-- Header Information -->
                        <div class="card p-4 mb-6 shadow">
                            <h3 class="text-lg font-semibold mb-4">Header Information</h3>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label class="block text-gray-600 mb-1">Requested By</label>
                                    <div class="w-full border rounded px-2 py-1 bg-gray-50">{{ requestBy }}</div>
                                </div>
                                <div>
                                    <label class="block text-gray-600 mb-1">Date Requested</label>
                                    <div class="w-full border rounded px-2 py-1 bg-gray-50">{{ requestDate }}</div>
                                </div>
                                <div>
                                    <label class="block text-gray-600 mb-1">Reason of Request</label>
                                    <div class="w-full border rounded px-2 py-1 bg-gray-50">{{ reason }}</div>
                                </div>
                                <div>
                                    <label class="block text-gray-600 mb-1">Remark</label>
                                    <div class="w-full border rounded px-2 py-1 bg-gray-50">{{ remark }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Materials -->
                        <div class="card p-4 mb-6 shadow">
                            <h3 class="text-lg font-semibold mb-4">Materials</h3>

                            <div class="overflow-x-auto">
                                <DataTable :value="itemsWithCalc" :responsiveLayout="'scroll'" class="p-datatable-sm">
                                    <Column field="ItemCode" header="Item Code" />

                                    <Column field="Description" header="Description" />

                                    <Column field="Uom" header="Units" />

                                    <Column field="UnitPrice" header="Unit Price" v-if="canViewPricing">
                                        <template #body="{ data }">
                                            {{ formatCurrency(data.UnitPrice) }}
                                        </template>
                                    </Column>

                                    <Column field="OrderedQty" header="Ordered Qty">
                                        <template #body="{ data }">
                                            {{ formatNumber(data.OrderedQty) }}
                                        </template>
                                    </Column>

                                    <Column field="NewOrder" header="Request Qty" v>
                                        <template #body="{ data }">
                                            {{ formatNumber(data.NewOrder) }}
                                        </template>
                                    </Column>

                                    <Column field="ExceededQty" header="Exceeded Qty">
                                        <template #body="{ data }">
                                            <span
                                                :class="{
                                                    'text-red-600 font-semibold': data.ExceededQty > 0
                                                }"
                                            >
                                                {{ formatNumber(data.ExceededQty) }}
                                            </span>
                                        </template>
                                    </Column>

                                    <Column field="ExceededPercent" header="% Exceed" v-if="canViewPricing">
                                        <template #body="{ data }">
                                            <span
                                                :class="{
                                                    'text-red-600 font-semibold': data.ExceededPercent > 0
                                                }"
                                            >
                                                {{ formatPercent(data.ExceededPercent) }}
                                            </span>
                                        </template>
                                    </Column>

                                    <Column field="EstimatedExceed" header="Estimated Exceed" v-if="canViewPricing">
                                        <template #body="{ data }">
                                            <span
                                                :class="{
                                                    'text-red-600 font-semibold': data.EstimatedExceed > 0
                                                }"
                                            >
                                                {{ formatCurrency(data.EstimatedExceed) }}
                                            </span>
                                        </template>
                                    </Column>

                                    <Column field="VarianceQty" header="Variance Qty">
                                        <template #body="{ data }">
                                            {{ formatNumber(data.VarianceQty) }}
                                        </template>
                                    </Column>

                                    <Column field="VarianceAmount" header="Variance Amount" v-if="canViewPricing">
                                        <template #body="{ data }">
                                            {{ formatCurrency(data.VarianceAmount) }}
                                        </template>
                                    </Column>

                                    <Column field="Remark" header="Remarks" />
                                </DataTable>
                            </div>

                            <div class="text-right mt-4 font-semibold" v-if="canViewPricing">Total Variance Amount: {{ totalVarianceAmount.toFixed(2) }}</div>
                        </div>

                        <DiscussionThread />
                    </div>

                    <div v-else-if="activeTab === 'activities'">
                        <ActivitiesLog />
                    </div>
                </template>
            </BaseTab>
        </div>
    </Motion>
</template>
