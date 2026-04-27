<script lang="ts" src="./ProjectDetail.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-6">
            <BreadcrumbList />

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="flex items-center gap-4">
                    <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Project Image" class="w-16 h-16 object-cover rounded-xl" />

                    <div class="flex flex-col">
                        <h1 class="text-2xl font-bold dark:text-white">MK1 Project</h1>
                        <p class="text-sm text-gray-500 dark:text-gray-300 mt-1">Project Code: MK1-001</p>
                        <div class="flex items-center gap-2 mt-1">
                            <PhBuildings :size="16" class="text-gray-500 dark:text-gray-300" />
                            <p class="text-sm text-gray-500 dark:text-gray-300 mt-1">ABC Company</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <p class="text-gray-500 dark:text-gray-300 font-semibold">Site Possession :</p>
                        <p class="text-black dark:text-white">29 Aug, 2025</p>
                    </div>
                    <div>
                        <p class="text-gray-500 dark:text-gray-300 font-semibold">Completion Date :</p>
                        <p class="text-black dark:text-white">31 Aug, 2025</p>
                    </div>
                    <div>
                        <p class="text-gray-500 dark:text-gray-300 font-semibold">Status :</p>
                        <span class="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full uppercase"> ONGOING </span>
                    </div>
                </div>

                <div>
                    <h3 class="font-semibold text-black dark:text-white mb-2">Information</h3>
                    <ul class="list-disc list-inside text-gray-700 dark:text-gray-200">
                        <li><span class="font-semibold">Description:</span> Guarded</li>
                        <li><span class="font-semibold">Remark:</span> New housing</li>
                    </ul>
                </div>
            </div>

            <BaseTab v-model="activeTab" :tabs="tabs" class="mb-4" />
            <div v-if="activeTab === 'projectRoles'">
                <Roles />
            </div>
            <div v-else-if="activeTab === 'location'">
                <Location />
            </div>
            <div v-else-if="activeTab === 'projectApproval'">
                <Approval />
            </div>
        </div>
    </Motion>
</template>
