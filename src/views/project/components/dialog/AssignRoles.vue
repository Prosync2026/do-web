<script lang="ts" src="./AssignRoles.script.ts"></script>

<template>
    <Dialog v-model:visible="visible" modal header="Assign Project Roles" class="w-[700px]" :closable="true" :dismissableMask="false" @hide="close">
        <!-- Selection row -->
        <div class="flex items-center gap-3 mb-4">
            <Dropdown v-model="selectedRole" :options="roles" optionLabel="label" optionValue="value" placeholder="Select Project Role" class="w-[180px] p-dropdown-sm" />
            <Dropdown v-model="selectedUser" :options="users" optionLabel="label" optionValue="value" placeholder="Select System User" class="w-[180px] p-dropdown-sm" />
            <Button label="Add" class="p-button-primary p-button-sm" :disabled="!selectedRole || !selectedUser" @click="addAssignment" ><template #icon><PhPlus class="mr-2" /></template></Button>
        </div>

        <!-- Assigned Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="text-left py-2 px-4 font-semibold">Project Role</th>
                        <th class="text-left py-2 px-4 font-semibold">System User</th>
                        <th class="py-2 px-4 font-semibold">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in assignments" :key="index" class="border-b hover:bg-gray-50 transition-colors">
                        <td class="py-2 px-4">{{ item.role }}</td>
                        <td class="py-2 px-4">{{ item.user }}</td>
                        <td class="py-2 px-4">
                            <Button class="p-button-text p-button-danger p-button-sm" @click="removeAssignment(index)" ><template #icon><PhTrash class="mr-2" /></template></Button>
                        </td>
                    </tr>
                    <tr v-if="assignments.length === 0">
                        <td colspan="3" class="py-2 px-4 text-gray-400 italic text-center">No assignments yet</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button label="Cancel" class="p-button-text text-gray-500" @click="close" />
            <Button label="Save" class="p-button-primary" @click="save" ><template #icon><PhCheck class="mr-2" /></template></Button>
        </template>
    </Dialog>
</template>
