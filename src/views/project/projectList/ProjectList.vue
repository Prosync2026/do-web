<script lang="ts" src="./ProjectList.script"></script>
<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-6">
            <BreadcrumbList />

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 class="text-2xl font-bold dark:text-white">Project List</h1>
                    <p class="text-gray-500 dark:text-white">Used to set up approvals, roles, and locations.</p>
                </div>
            </div>

            <!-- Search and Company Dropdown -->
            <div class="flex flex-col md:flex-row gap-4 mb-6">
                <input v-model="search" type="text" placeholder="Search..." class="border rounded p-2 w-full md:w-1/3" />
                <Dropdown v-model="selectedCompany" :options="companyList" optionLabel="company" placeholder="Select Company" class="w-full md:w-1/3" />
            </div>

            <!-- Card List -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div v-for="project in filteredProjectList" :key="project.id" class="border rounded-lg p-4 relative shadow hover:shadow-md transition">
                    <div class="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs rounded-bl-lg">Current</div>

                    <div class="flex items-center gap-4 mb-4">
                        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Project" class="w-10 h-10 object-cover rounded-md" />

                        <div>
                            <h2 class="font-bold">{{ project.projectName }}</h2>
                            <p class="text-gray-500 text-sm">{{ project.projectCode }}</p>
                        </div>
                    </div>

                    <div class="text-sm text-gray-600 mb-2">
                        <div><PhHouse /> {{ project.propertyType || 'LAND/HI-RISE' }}</div>
                        <div><PhBuildings :size="18"  /> {{ project.subElement }}</div>
                        <div><PhMapPin :size="18"  /> {{ project.location || 'Kuala Lumpur' }}</div>
                    </div>

                    <!-- Status -->
                    <div class="mt-4 flex justify-between items-center">
                        <span class="text-gray-700 text-xs font-medium">Status:</span>
                        <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">{{ project.status || 'ONGOING' }}</span>
                    </div>

                    <Button label="View Info" class="mt-4" @click="handleAction('view', project)" />
                </div>
            </div>
        </div>
    </Motion>
</template>
