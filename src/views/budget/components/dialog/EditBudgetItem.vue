<script src="./EditBudgetItem.script.ts"></script>

<template>
    <Teleport to="body">
        <ProModal v-model="localVisible" title="Edit Budget Item" size="lg" @update:modelValue="!$event && close()">
            <div class="grid grid-cols-2 gap-4">
                <!-- Item Code -->
                <div>
                    <ProInput v-model="form.ItemCode" label="Item Code" placeholder="Enter item code" required />
                    <small class="p-error text-red-500 text-xs" v-if="errors.ItemCode">{{ errors.ItemCode }}</small>
                </div>

                <!-- Description -->
                <div>
                    <ProInput v-model="form.Description" label="Description" placeholder="Enter description" required />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Description">{{ errors.Description }}</small>
                </div>

                <!-- Description 2 -->
                <div>
                    <ProInput v-model="form.Description2" label="Description 2" placeholder="Optional description" />
                </div>

                <!-- Category -->
                <div>
                    <ProInput v-model="form.Category" label="Category" placeholder="Category" required />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Category">{{ errors.Category }}</small>
                </div>

                <!-- Location 1 -->
                <div>
                    <ProInput v-model="form.Location1" label="Location 1" placeholder="Location 1" required />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Location1">{{ errors.Location1 }}</small>
                </div>

                <!-- Location 2 -->
                <div>
                    <ProInput v-model="form.Location2" label="Location 2" placeholder="Location 2" />
                </div>

                <!-- Element -->
                <div>
                    <ProInput v-model="form.Element" label="Element" placeholder="Element" required />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Element">{{ errors.Element }}</small>
                </div>

                <!-- Sub Element -->
                <div>
                    <ProInput v-model="form.SubElement" label="Sub Element" placeholder="Sub element" required />
                    <small class="p-error text-red-500 text-xs" v-if="errors.SubElement">{{ errors.SubElement }}</small>
                </div>

                <!-- Sub Sub Element -->
                <div>
                    <ProInput v-model="form.SubSubElement" label="Sub Sub Element" placeholder="Sub sub element" />
                </div>

                <!-- Unit -->
                <div>
                    <ProInput v-model="form.Unit" label="Unit" placeholder="Unit (e.g. pcs, m)" required />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Unit">{{ errors.Unit }}</small>
                </div>

                <!-- Quantity -->
                <div>
                    <label class="required-label">Quantity</label>
                    <InputNumber v-model="form.Quantity" :min="0" class="w-full" />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Quantity">{{ errors.Quantity }}</small>
                </div>

                <!-- Rate -->
                <div>
                    <label class="required-label">Rate</label>
                    <InputNumber v-model="form.Rate" :min="0" :minFractionDigits="2" class="w-full" />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Rate">{{ errors.Rate }}</small>
                </div>

                <!-- Amount (computed, read-only) -->
                <div>
                    <ProInput label="Amount (auto)" :modelValue="`RM ${computedAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`" readonly />
                </div>

                <!-- Wastage -->
                <div>
                    <label>Wastage (%)</label>
                    <InputNumber v-model="form.Wastage" :min="0" class="w-full" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <ProButton variant="secondary" @click="close" :disabled="submitting">Cancel</ProButton>
                    <ProButton variant="primary" :loading="submitting" @click="submit">Save Changes</ProButton>
                </div>
            </template>
        </ProModal>
    </Teleport>
</template>

<style scoped>
.required-label::after {
    content: ' *';
    color: red;
}
</style>
