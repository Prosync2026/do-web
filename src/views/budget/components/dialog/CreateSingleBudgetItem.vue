<template>
    <Dialog v-model:visible="visible" header="Add Single Budget Item" modal closable :style="{ width: '700px' }" @hide="close">
        <div class="grid grid-cols-2 gap-4">
            <!-- Item Code -->
            <div>
                <label class="required-label">Item Code</label>
                <InputText v-model="form.ItemCode" placeholder="Enter item code" class="w-full" />
                <small class="p-error text-red-500 text-xs" v-if="errors.ItemCode">{{ errors.ItemCode }}</small>
            </div>

            <!-- Description -->
            <div>
                <label class="required-label">Description</label>
                <InputText v-model="form.Description" placeholder="Enter description" class="w-full" />
                <small class="p-error text-red-500 text-xs" v-if="errors.Description">{{ errors.Description }}</small>
            </div>

            <!-- Description 2 -->
            <div>
                <label>Description 2</label>
                <InputText v-model="form.Description2" placeholder="Optional description" class="w-full" />
            </div>

            <!-- Category -->
            <div>
                <label class="required-label">Category</label>
                <InputText v-model="form.Category" placeholder="Category" class="w-full" />
                <small class="p-error text-red-500 text-xs" v-if="errors.Category">{{ errors.Category }}</small>
            </div>

            <!-- Location 1 -->
            <div>
                <label class="required-label">Location 1</label>
                <InputText v-model="form.Location1" placeholder="Location 1" class="w-full" />
                <small class="p-error text-red-500 text-xs" v-if="errors.Location1">{{ errors.Location1 }}</small>
            </div>

            <!-- Location 2 -->
            <div>
                <label>Location 2</label>
                <InputText v-model="form.Location2" placeholder="Location 2" class="w-full" />
            </div>

            <!-- Element -->
            <div>
                <label class="required-label">Element</label>
                <InputText v-model="form.Element" placeholder="Element" class="w-full" />
                <small class="p-error text-red-500 text-xs" v-if="errors.Element">{{ errors.Element }}</small>
            </div>

            <!-- Sub Element -->
            <div>
                <label>Sub Element</label>
                <InputText v-model="form.SubElement" placeholder="Sub element" class="w-full" />
            </div>

            <!-- Sub Sub Element -->
            <div>
                <label>Sub Sub Element</label>
                <InputText v-model="form.SubSubElement" placeholder="Sub sub element" class="w-full" />
            </div>

            <!-- Unit -->
            <div>
                <label class="required-label">Unit</label>
                <InputText v-model="form.Unit" placeholder="Unit (e.g. pcs, m)" class="w-full" />
                <small class="p-error text-red-500 text-xs" v-if="errors.Unit">{{ errors.Unit }}</small>
            </div>

            <!-- Quantity -->
            <div>
                <label>Quantity</label>
                <InputNumber v-model.number="form.Quantity" :min="0" class="w-full" />
            </div>

            <!-- Rate -->
            <div>
                <label>Rate</label>
                <InputNumber v-model.number="form.Rate" :min="0" class="w-full" />
            </div>

            <!-- Amount -->
            <div>
                <label class="required-label">Amount</label>
                <InputNumber v-model.number="form.Amount" :min="0" class="w-full" />
                <small class="p-error text-red-500 text-xs" v-if="errors.Amount">{{ errors.Amount }}</small>
            </div>

            <!-- Wastage -->
            <div>
                <label>Wastage (%)</label>
                <InputNumber v-model.number="form.Wastage" :min="0" class="w-full" />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" outlined @click="close" />
                <Button label="Add Item" @click="submit" />
            </div>
        </template>
    </Dialog>
</template>

<script src="./CreateSingleBudgetItem.script.ts"></script>

<style scoped>
.required-label::after {
    content: ' *';
    color: red;
}
</style>
