<script setup lang="ts">
import { PhEyeSlash, PhEye } from '@phosphor-icons/vue';
import Button from 'primevue/button';
import { useLoginForm } from './LoginForm.script';

const { username, password, showPassword, togglePasswordVisibility, handleSubmit, isLoading } = useLoginForm();
</script>

<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Username -->
        <div>
            <input v-model="username" type="text" placeholder="Username" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-sky-400 focus:outline-none" />
        </div>

        <!-- Password -->
        <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-sky-400 focus:outline-none pr-10" />
            <button type="button" class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500" @click="togglePasswordVisibility">
                <PhEye v-if="!showPassword" :size="18" />
                <PhEyeSlash :size="18" v-else  />
            </button>
        </div>

        <!-- Submit Button -->
        <Button type="submit" label="Login" class="w-full" severity="info" :loading="isLoading" :disabled="isLoading" />
    </form>
</template>
