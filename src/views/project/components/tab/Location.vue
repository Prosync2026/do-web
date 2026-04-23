<script lang="ts" src="./Location.script.ts"></script>
<template>
    <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[300px] border p-4 flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <span class="font-bold text-lg">Preview Location</span>
                <div class="flex gap-2">
                    <Button label="Export CSV" class="p-button-sm" @click="downloadCSV" ><template #icon><PhFile class="mr-2" /></template></Button>
                    <Button label="Export Image" class="p-button-sm" @click="exportImage" ><template #icon><PhImage class="mr-2" /></template></Button>
                </div>
            </div>

            <div ref="exportContent" class="p-3 border-dashed border border-gray-300 flex-1 overflow-auto">
                <LocationItem v-for="(location, index) in groupedLocations" :key="index" :location="location" />
            </div>
        </div>

        <div class="flex-1 min-w-[300px] border p-4 flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <span class="font-bold text-lg">Location Set Up</span>
                <div>
                    <Button label="Import CSV" class="p-button-sm" @click="triggerFileInput" ><template #icon><PhUpload class="mr-2" /></template></Button>
                    <input type="file" ref="fileInput" style="display: none" @change="importCSV" />
                </div>
            </div>

            <form @submit.prevent="submitForm" class="flex flex-col gap-3">
                <label class="form-label">Select Location Level</label>
                <Dropdown v-model="selectedLevel" :options="levelOptions" optionLabel="label" optionValue="value" placeholder="Select Location Level" />

                <div v-if="selectedLevel === 2">
                    <label class="form-label">Select Parent Location 1</label>
                    <Dropdown v-model="selectedParents.location_1" :options="locationOptions.location_1.map((o) => ({ label: o, value: o }))" optionLabel="label" optionValue="value" placeholder="Select Location 1" class="w-full" />
                </div>
                <div v-if="selectedLevel">
                    <label class="form-label">Enter Location Name</label>
                    <InputText v-model="newLocationName" placeholder="Enter location name" class="w-full" />
                </div>

                <Button type="submit" label="Submit" :disabled="!selectedLevel || !newLocationName || (selectedLevel === 2 && !selectedParents.location_1)" class="mt-2" ><template #icon><PhCheck class="mr-2" /></template></Button>
            </form>
        </div>
    </div>
</template>
