<script lang="ts" src="./verifyItem.script"></script>

<template>
    <div class="p-mb-5">
        <div v-if="!isPoSelected" class="flex flex-col justify-center py-5 gap-4 w-full">
            <Message severity="warn" variant="outlined" :closable="false">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Please select a Purchase Order before proceeding.
            </Message>

            <div class="flex justify-end mt-4 gap-2 w-full">
                <ProButton variant="secondary" @click="goBack">Back</ProButton>
            </div>
        </div>

        <div v-else>
            <Message severity="secondary" variant="outlined" :closable="false">
                <i class="pi pi-verified"></i>
                Enter the actual quantities delivered for each item. Items marked as complete will be highlighted.
            </Message>

            <ProCard class="mt-6 shadow-sm">
                    <div class="flex flex-col gap-3 mb-6">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-box"></i>
                            <span class="font-bold">Delivery Summary for {{ poNumber }}</span>
                        </div>

                        <div class="grid grid-cols-3 text-center text-sm font-medium border border-gray-100 rounded-lg p-3 bg-gray-50">
                            <div>
                                <div class="text-gray-500 text-xs">TOTAL ITEMS</div>
                                <div class="text-lg font-bold text-gray-900">{{ itemList.length }}</div>
                            </div>

                            <div>
                                <div class="text-gray-500 text-xs">ITEM DELIVERED</div>
                                <div class="text-lg font-bold text-green-600">
                                    {{ itemList.filter((item) => item.status === 'Delivered').length }}
                                </div>
                            </div>
                            <div>
                                <div class="text-gray-500 text-xs">PENDING</div>
                                <div class="text-lg font-bold text-red-500">
                                    {{ itemList.filter((item) => item.status === 'Pending').length }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Form @submit="onFormSubmit" class="flex flex-col gap-4 mt-1 w-full sm:w-full">
                        <div class="grid grid-cols-1 gap-4 p-3">
                            <ProCard v-for="(item, index) in itemList" :key="index" class="border rounded-lg shadow-sm">
                                    <div class="flex items-center gap-2 cursor-pointer mb-2" @click="toggle(index)">
                                        <i :class="['pi', expanded.includes(index) ? 'pi-chevron-down' : 'pi-chevron-right', 'text-gray-600']"></i>

                                        <div class="flex items-center justify-between w-full">
                                            <div class="flex flex-col">
                                                <span class="font-bold text-base">{{ item.name }}</span>
                                                <span class="text-sm text-gray-500">{{ item.order }}</span>
                                            </div>

                                            <ProTag :variant="item.status === 'Delivered' ? 'success' : 'info'" class="text-gray-800 shrink-0" :label="item.status" />
                                        </div>
                                    </div>
                                    <div v-show="expanded.includes(index)" class="text-sm text-gray-700 mt-3">
                                        <div class="grid grid-cols-3 gap-4 mb-3 ms-5">
                                            <div>
                                                <div class="text-xs text-gray-500 font-medium">Ordered Qty</div>
                                                <div class="font-semibold">{{ item.total }} <span class="text-gray-400 text-xs">{{ item.uom }}</span></div>
                                            </div>
                                            <div>
                                                <div class="text-xs text-gray-500 font-medium">Unit Price</div>
                                                <div class="font-semibold">RM {{ item.price.toFixed(2) }}</div>
                                            </div>
                                            <div>
                                                <div class="text-xs text-gray-500 font-medium">RO Reference</div>
                                                <div class="font-semibold text-xs">{{ item.roDocNo }}</div>
                                            </div>
                                        </div>

                                        <SeparatorLine />

                                        <div class="flex items-center gap-2 mt-2 ms-5">
                                            <label class="font-medium">Delivery Qty:</label>
                                            <InputNumber v-model="item.delivered" class="w-20 text-center" :min="0" :max="item.total" />
                                            <span class="text-gray-500 text-sm">{{ item.uom }} &nbsp;/&nbsp; {{ item.total }} {{ item.uom }} </span>
                                        </div>
                                    </div>
                            </ProCard>
                        </div>

                        <div class="flex justify-end mt-4 gap-2">
                            <ProButton type="button" variant="secondary" @click="goBack">Back</ProButton>
                            <ProButton type="submit">Next</ProButton>
                        </div>
                    </Form>
            </ProCard>
        </div>
    </div>
</template>
