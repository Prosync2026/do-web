<script src="./CreateSingleBudgetItem.script.ts"></script>

<template>
    <Teleport to="body">
        <ProModal v-model="localVisible" title="Add Manual Budget Item" size="lg" class="!z-[110]" @update:modelValue="!$event && close()">
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
                    <ProInput type="number" v-model.number="form.Quantity" :min="0" label="Quantity" required class="w-full" />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Quantity">{{ errors.Quantity }}</small>
                </div>

                <!-- Rate -->
                <div>
                    <ProInput type="number" v-model.number="form.Rate" :min="0" label="Rate" class="w-full" />
                </div>

                <!-- Amount -->
                <div>
                    <ProInput type="number" v-model.number="form.Amount" :min="0" label="Amount" required class="w-full" />
                    <small class="p-error text-red-500 text-xs" v-if="errors.Amount">{{ errors.Amount }}</small>
                </div>

                <!-- Wastage -->
                <div>
                    <ProInput type="number" v-model.number="form.Wastage" :min="0" label="Wastage (%)" class="w-full" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <ProButton variant="secondary" @click="close">Cancel</ProButton>
                    <ProButton variant="primary" @click="submit">Add Item</ProButton>
                </div>
            </template>
        </ProModal>
    </Teleport>
</template>


