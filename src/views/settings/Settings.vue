<script setup lang="ts">
import { PhCpu, PhFloppyDisk, PhEye, PhEyeSlash } from '@phosphor-icons/vue';
import SettingsScript from './Settings.script';

const { 
    token, 
    isLoading, 
    saveToken, 
    isTokenVisible, 
    toggleVisibility 
} = SettingsScript;
</script>

<template>
    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <h5 class="m-0">System Settings</h5>
        </div>
        
        <p class="text-gray-500 dark:text-gray-400 mb-6 font-medium">
            Manage system-wide configuration. These settings affect the behavior of the application for all users.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card class="border shadow-none">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <PhCpu :size="18" class="text-primary"  /> 
                        Smart Scan API
                    </div>
                </template>
                <template #subtitle>
                    Configure the authentication token used by the AI extraction service.
                </template>
                <template #content>
                    <div class="flex flex-col mt-4">
                        <label for="api_token" class="font-semibold mb-2 text-gray-800 dark:text-white">API Bearer Token</label>
                        <div class="relative w-full">
                            <InputText 
                                id="api_token" 
                                v-model="token" 
                                :type="isTokenVisible ? 'text' : 'password'" 
                                placeholder="Enter API Bearer Token" 
                                class="w-full pr-10" 
                            />
                            <component 
                                :is="isTokenVisible ? PhEyeSlash : PhEye" 
                                class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                @click="toggleVisibility"
                            />
                        </div>
                        <small class="text-gray-500 mt-2">
                            This token is required for the document OCR service to parse PDF files.
                        </small>
                    </div>
                </template>
                <template #footer>
                    <div class="flex justify-end mt-4">
                        <Button 
                            label="Save" 
                            :loading="isLoading" 
                            @click="saveToken" 
                        ><template #icon><PhFloppyDisk class="mr-2" /></template></Button>
                    </div>
                </template>
            </Card>
        </div>
            </div>
</template>
