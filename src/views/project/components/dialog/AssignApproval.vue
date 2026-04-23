<script lang="ts" src="./AssignApproval.script.ts"></script>
<template>
    <Dialog :visible="visible" modal header="Assign Project Approval" class="w-[750px]" @hide="close">
        <!-- Approval Flow Header -->
        <div class="flex items-center justify-between mb-5">
            <h6 class="text-gray-700 font-semibold text-lg mb-0">Approval Flow</h6>
            <Button class="p-button-text p-button-sm hover:text-teal-700" label="Edit Flow" @click="openUpdateRoles" ><template #icon><PhPencil class="mr-2" /></template></Button>
        </div>

        <div class="approval-flow text-center mb-8">
            <div class="flex items-center justify-center gap-4 flex-wrap">
                <div v-for="(step, index) in approvalSteps" :key="step.role" class="flex items-center">
                    <div class="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 font-semibold min-w-[100px] text-center shadow-sm">
                        {{ step.role }}
                    </div>
                    <PhCaretRight :size="18" class="text-gray-400 text-lg ml-3 mr-1" v-if="index < approvalSteps.length - 1"  />
                </div>
            </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table class="min-w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="text-left py-3 px-5 font-semibold text-gray-600 w-1/3">Role</th>
                        <th class="text-left py-3 px-5 font-semibold text-gray-600">Assigned Users</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(step, index) in approvalSteps" :key="index" class="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td class="py-3 px-5 font-medium text-gray-700">
                            {{ step.role }}
                        </td>
                        <td class="py-3 px-5">
                            <div v-if="step.users.length" class="flex flex-wrap gap-2">
                                <span v-for="user in step.users" :key="user" class="bg-teal-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {{ user }}
                                </span>
                            </div>
                            <div v-else class="text-gray-400 text-xs italic">No users assigned</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <template #footer>
            <Button label="Close" class="p-button-text text-gray-500" @click="close" ><template #icon><PhX class="mr-2" /></template></Button>
            <Button label="Save Changes" class="p-button-primary" @click="save" ><template #icon><PhCheck class="mr-2" /></template></Button>
        </template>

        <UpdateApprovalRoles v-model:visible="showUpdateRoles" />
    </Dialog>
</template>
