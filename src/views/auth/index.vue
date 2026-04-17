<script setup lang="ts">
import { ref } from 'vue';
import LoginForm from './components/form/LoginForm.vue';
import { useLoginCardAnimation } from './index.script';

const { loginCard } = useLoginCardAnimation();

const loginUsername = ref('');
const loginPassword = ref('');
</script>

<template>
    <div class="flex items-center justify-center min-h-screen p-4 custom-layout-gradient shadow-lg">
        <div ref="loginCard" class="login-card flex w-full max-w-4xl rounded-lg shadow-lg overflow-hidden">
            <!-- Left Section -->
            <div class="hidden lg:flex w-1/2 items-center justify-center" style="background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #22d3ee 100%);">
                <div class="flex flex-col items-center text-center px-6">
                    <img src="/images/logo/illustration-truck.png" alt="Delivery Illustration" class="object-contain w-2/3 drop-shadow-lg -mt-4" />
                    <h2 class="text-white text-lg font-semibold tracking-wide mt-6 mb-2">Accurate <span class="mx-3">·</span> Transparent <span class="mx-2">·</span> Reliable</h2>
                    <p class="text-white text-sm opacity-90">Your one-stop solution for managing delivery orders</p>
                </div>
            </div>

            <!-- Right Section -->
            <div class="flex flex-col justify-center w-full lg:w-1/2 p-10 bg-white">
                <div class="flex justify-center mb-6">
                    <img src="/images/logo/prosync-logo.png" alt="Prosync Logo" class="h-10" />
                </div>
                <h1 class="text-2xl font-bold text-center mb-1 text-brand-primary tracking-tight">DO SYSTEM</h1>
                <p class="text-center text-gray-500 mb-6 text-xs uppercase tracking-widest font-semibold">Delivery order management system</p>

                <!-- Login Form -->
                <LoginForm v-model:modelValueUsername="loginUsername" v-model:modelValuePassword="loginPassword" />
            </div>
        </div>
    </div>
</template>
