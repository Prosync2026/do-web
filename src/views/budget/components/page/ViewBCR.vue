<script src="./ViewBCR.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -20 }" :transition="{ duration: 0.6 }">
        <ProCard padding="lg">
            <ProTabs v-model="activeTab" :tabs="tabItems">
                <!-- Tab: Detail -->
                <div v-if="activeTab === 'detail'">
                    <!-- Header Information -->
                    <ProCard title="Header Information" shadow class="mb-6">
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
                    </ProCard>

                    <!-- Materials -->
                    <ProCard title="Materials" shadow class="mb-6">
                        <!-- Desktop View -->
                        <div class="hidden lg:block overflow-x-auto">
                            <DataTable :value="itemsWithCalc" :responsiveLayout="'scroll'" class="p-datatable-sm">
                                <Column field="ItemCode" header="Item Code" />

                                <Column field="Description" header="Description" />

                                <Column field="Uom" header="Units" />

                                <Column field="UnitPrice" header="Unit Price" v-if="canViewPricing">
                                    <template #body="{ data }">
                                        {{ formatCurrency(data.UnitPrice) }}
                                    </template>
                                </Column>

                                <Column field="BudgetQty" header="Budget Qty">
                                    <template #body="{ data }">
                                        {{ data.budgetItemStatistics?.budgetQty || '-' }}
                                    </template>
                                </Column>

                                <Column field="OrderedQty" header="Ordered Qty">
                                    <template #body="{ data }">
                                        {{ formatNumber(data.OrderedQty) }}
                                    </template>
                                </Column>

                                <Column field="NewOrder" header="Request Qty">
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
                        
                        <!-- Mobile View -->
                        <div class="block lg:hidden mt-2 space-y-4">
                            <ProCard v-for="(data, index) in itemsWithCalc" :key="index" class="shadow-sm border border-gray-100">
                                <div class="flex flex-col gap-2">
                                    <div class="flex justify-between items-start">
                                        <div class="flex flex-col pr-2">
                                            <span class="text-sm font-semibold text-gray-800">{{ data.ItemCode }}</span>
                                            <span class="text-xs text-gray-500">{{ data.Description }}</span>
                                        </div>
                                        <span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 whitespace-nowrap">{{ data.Uom }}</span>
                                    </div>
                                    
                                    <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm border-t border-gray-100 pt-3">
                                        <div class="flex justify-between" v-if="canViewPricing">
                                            <span class="text-xs text-gray-500">Unit Price</span>
                                            <span class="font-medium">{{ formatCurrency(data.UnitPrice) }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-xs text-gray-500">Budget Qty</span>
                                            <span class="font-medium">{{ data.budgetItemStatistics?.budgetQty || '-' }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-xs text-gray-500">Ordered Qty</span>
                                            <span class="font-medium">{{ formatNumber(data.OrderedQty) }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-xs text-gray-500">Request Qty</span>
                                            <span class="font-medium">{{ formatNumber(data.NewOrder) }}</span>
                                        </div>
                                        
                                        <div class="col-span-2 border-t border-gray-50 my-1"></div>
                                        
                                        <div class="flex justify-between">
                                            <span class="text-xs text-gray-500">Exceeded Qty</span>
                                            <span class="font-medium" :class="{'text-red-600': data.ExceededQty > 0}">{{ formatNumber(data.ExceededQty) }}</span>
                                        </div>
                                        <div class="flex justify-between" v-if="canViewPricing">
                                            <span class="text-xs text-gray-500">% Exceed</span>
                                            <span class="font-medium" :class="{'text-red-600': data.ExceededPercent > 0}">{{ formatPercent(data.ExceededPercent) }}</span>
                                        </div>
                                        <div class="flex justify-between" v-if="canViewPricing">
                                            <span class="text-xs text-gray-500">Est. Exceed</span>
                                            <span class="font-medium" :class="{'text-red-600': data.EstimatedExceed > 0}">{{ formatCurrency(data.EstimatedExceed) }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-xs text-gray-500">Variance Qty</span>
                                            <span class="font-medium">{{ formatNumber(data.VarianceQty) }}</span>
                                        </div>
                                        <div class="flex justify-between" v-if="canViewPricing">
                                            <span class="text-xs text-gray-500">Variance Amt</span>
                                            <span class="font-medium">{{ formatCurrency(data.VarianceAmount) }}</span>
                                        </div>
                                    </div>
                                    <div class="mt-2 text-sm bg-gray-50 p-2 rounded" v-if="data.Remark">
                                        <span class="text-xs text-gray-500 block mb-0.5">Remarks</span>
                                        <span class="text-gray-700 italic">{{ data.Remark }}</span>
                                    </div>
                                </div>
                            </ProCard>
                        </div>

                        <div class="flex justify-end mt-4 pt-4 border-t border-gray-200" v-if="canViewPricing">
                            <div class="text-right">
                                <span class="text-sm text-gray-500 mr-2">Total Variance Amount</span>
                                <span class="font-bold text-lg text-text-heading">{{ formatCurrency(totalVarianceAmount) }}</span>
                            </div>
                        </div>
                    </ProCard>

                    <DiscussionThread />
                </div>

                <div v-else-if="activeTab === 'activities'">
                    <ActivitiesLog />
                </div>
            </ProTabs>
        </ProCard>
    </Motion>
</template>
