<script lang="ts" src="./verifyItem.script"></script>

<template>
    <div class="p-mb-5">
        <div v-if="!isPoSelected" class="flex flex-col justify-center py-5 gap-4 w-full">
            <Message severity="warn" variant="outlined" :closable="false">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Please select a Purchase Order before proceeding.
            </Message>

            <div class="flex justify-end mt-4 gap-2 w-full">
                <Button type="button" label="Back" severity="secondary" @click="goBack" />
            </div>
        </div>

        <div v-else>
            <Message severity="secondary" variant="outlined" :closable="false">
                <i class="pi pi-verified"></i>
                Enter the actual quantities delivered for each item. Items marked as complete will be highlighted.
            </Message>

            <Card class="mt-6 border">
                <template #title>
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-box"></i>
                            <span>Delivery Summary for {{ poNumber }}</span>
                        </div>

                        <div class="grid grid-cols-3 text-center text-sm font-medium">
                            <div>
                                <div class="text-gray-500">TOTAL ITEMS</div>
                                <div class="text-lg font-bold text-gray-900">{{ itemList.length }}</div>
                            </div>

                            <div>
                                <div class="text-gray-500">ITEM DELIVERED</div>
                                <div class="text-lg font-bold text-green-600">
                                    {{ itemList.filter((item) => item.status === 'Delivered').length }}
                                </div>
                            </div>
                            <div>
                                <div class="text-gray-500">PENDING</div>
                                <div class="text-lg font-bold text-red-500">
                                    {{ itemList.filter((item) => item.status === 'Pending').length }}
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template #content>
                    <Form @submit="onFormSubmit" class="flex flex-col gap-4 mt-1 w-full sm:w-full">
                        <div class="grid grid-cols-1 gap-4 p-3">
                            <Card v-for="(item, index) in itemList" :key="index" class="border rounded-lg shadow-sm">
                                <template #title>
                                    <div class="flex items-center gap-2 cursor-pointer" @click="toggle(index)">
                                        <i :class="['pi', expanded.includes(index) ? 'pi-chevron-down' : 'pi-chevron-right', 'text-gray-600']"></i>

                                        <div class="flex items-center justify-between w-full">
                                            <div class="flex flex-col">
                                                <span class="font-bold text-base">{{ item.name }}</span>
                                                <span class="text-sm text-gray-500">{{ item.order }}</span>
                                            </div>

                                            <Badge :severity="item.status === 'Delivered' ? 'success' : 'secondary'" class="text-gray-800">
                                                {{ item.status }}
                                            </Badge>
                                        </div>
                                    </div>
                                </template>

                                <template #content>
                                    <div v-show="expanded.includes(index)" class="text-sm text-gray-700 mt-3">
                                        <div class="grid grid-cols-3 gap-4 mb-3 ms-5">
                                            <div>
                                                <div class="text-xs text-gray-500 font-medium">Location</div>
                                                <div class="font-semibold">{{ item.location }}</div>
                                            </div>
                                            <div>
                                                <div class="text-xs text-gray-500 font-medium">Element</div>
                                                <div class="font-semibold">{{ item.category }}</div>
                                            </div>
                                            <div>
                                                <div class="text-xs text-gray-500 font-medium">Item Type</div>
                                                <div class="font-semibold">{{ item.type }}</div>
                                            </div>
                                        </div>

                                        <SeparatorLine />

                                        <div class="flex items-center gap-2 mt-2 ms-5">
                                            <label class="font-medium">Delivery Qty:</label>
                                            <InputNumber v-model="item.delivered" class="w-20 text-center" />
                                            <span>
                                                <span v-if="item.order.includes('kg')">kg</span>
                                                <span v-else-if="item.order.includes('m³')">m³</span>
                                                <span v-else-if="item.order.includes('pcs')">pcs</span>
                                                <span v-else-if="item.order.includes('unit')">unit</span>
                                            </span>
                                            <span class="text-gray-500 text-sm">
                                                of {{ item.total }}
                                                <span v-if="item.order.includes('kg')">kg</span>
                                                <span v-else-if="item.order.includes('m³')">m³</span>
                                                <span v-else-if="item.order.includes('pcs')">pcs</span>
                                                <span v-else-if="item.order.includes('unit')">unit</span>
                                                ordered
                                            </span>
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>

                        <div class="flex justify-end mt-4 gap-2">
                            <Button type="button" label="Back" severity="secondary" @click="goBack" />
                            <Button type="submit" label="Next" severity="primary" />
                        </div>
                    </Form>
                </template>
            </Card>
        </div>
    </div>
</template>
